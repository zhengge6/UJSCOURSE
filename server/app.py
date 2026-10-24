#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""UJSCOURSE activation API — stdlib only (no pip)."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE = Path(__file__).resolve().parent
DB = BASE / "activate.db"
SECRET_FILE = BASE / ".runtime_secret"
HOST = os.environ.get("UJS_HOST", "0.0.0.0")
PORT = int(os.environ.get("UJS_PORT", "8787"))
TOKEN_TTL = int(os.environ.get("UJS_TOKEN_TTL", str(180 * 24 * 3600)))


def load_secrets() -> tuple[str, str]:
    if SECRET_FILE.exists():
        lines = SECRET_FILE.read_text(encoding="utf-8").strip().splitlines()
        if len(lines) >= 2:
            return lines[0].strip(), lines[1].strip()
    secret = os.environ.get("UJS_ACT_SECRET") or secrets.token_hex(32)
    admin = os.environ.get("UJS_ADMIN_KEY") or secrets.token_hex(16)
    SECRET_FILE.write_text(f"{secret}\n{admin}\n", encoding="utf-8")
    try:
        os.chmod(SECRET_FILE, 0o600)
    except OSError:
        pass
    return secret, admin


SECRET, ADMIN_KEY = load_secrets()


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS codes (
              code TEXT PRIMARY KEY,
              note TEXT,
              max_devices INTEGER NOT NULL DEFAULT 1,
              used_count INTEGER NOT NULL DEFAULT 0,
              disabled INTEGER NOT NULL DEFAULT 0,
              created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS binds (
              code TEXT NOT NULL,
              device TEXT NOT NULL,
              token TEXT NOT NULL,
              exp INTEGER NOT NULL,
              created_at INTEGER NOT NULL,
              PRIMARY KEY (code, device)
            );
            """
        )


def sign_token(payload: dict) -> str:
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    sig = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    return (body + "." + sig).encode().hex()


def verify_token(token: str) -> dict | None:
    try:
        raw = bytes.fromhex(token).decode()
        body, sig = raw.rsplit(".", 1)
        expect = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expect, sig):
            return None
        data = json.loads(body)
        if int(data.get("exp", 0)) < int(time.time()):
            return None
        return data
    except Exception:
        return None


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, code: int, obj: dict):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self._cors()
        self.end_headers()
        self.wfile.write(raw)

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return {}

    def _admin_ok(self) -> bool:
        key = self.headers.get("X-Admin-Key") or ""
        if not key:
            qs = parse_qs(urlparse(self.path).query)
            key = (qs.get("admin_key") or [""])[0]
        return hmac.compare_digest(key, ADMIN_KEY)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            return self._json(200, {"ok": True, "ts": int(time.time())})
        if path == "/v1/admin/list":
            if not self._admin_ok():
                return self._json(401, {"ok": False, "msg": "unauthorized"})
            with db() as conn:
                rows = conn.execute(
                    "SELECT code, note, max_devices, used_count, disabled, created_at FROM codes ORDER BY created_at DESC LIMIT 200"
                ).fetchall()
            return self._json(200, {"ok": True, "items": [dict(r) for r in rows]})
        return self._json(404, {"ok": False, "msg": "not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        data = self._body()

        if path == "/v1/activate":
            code = str(data.get("code") or "").strip().upper()
            device = str(data.get("device") or "").strip()[:128]
            if not code or not device:
                return self._json(400, {"ok": False, "msg": "missing code/device"})
            now = int(time.time())
            with db() as conn:
                row = conn.execute("SELECT * FROM codes WHERE code=?", (code,)).fetchone()
                if not row or row["disabled"]:
                    return self._json(403, {"ok": False, "msg": "invalid code"})
                bind = conn.execute(
                    "SELECT * FROM binds WHERE code=? AND device=?", (code, device)
                ).fetchone()
                if bind and int(bind["exp"]) > now:
                    return self._json(
                        200,
                        {
                            "ok": True,
                            "token": bind["token"],
                            "exp": bind["exp"],
                            "msg": "already bound",
                        },
                    )
                devices = conn.execute(
                    "SELECT COUNT(*) AS c FROM binds WHERE code=?", (code,)
                ).fetchone()["c"]
                if devices >= int(row["max_devices"]) and not bind:
                    return self._json(403, {"ok": False, "msg": "device limit"})
                exp = now + TOKEN_TTL
                token = sign_token({"c": code, "d": device, "exp": exp, "iat": now})
                conn.execute(
                    """
                    INSERT INTO binds(code, device, token, exp, created_at)
                    VALUES(?,?,?,?,?)
                    ON CONFLICT(code, device) DO UPDATE SET token=excluded.token, exp=excluded.exp
                    """,
                    (code, device, token, exp, now),
                )
                if not bind:
                    conn.execute(
                        "UPDATE codes SET used_count = used_count + 1 WHERE code=?",
                        (code,),
                    )
                conn.commit()
            return self._json(200, {"ok": True, "token": token, "exp": exp, "msg": "activated"})

        if path == "/v1/verify":
            token = str(data.get("token") or "").strip()
            device = str(data.get("device") or "").strip()[:128]
            payload = verify_token(token)
            if not payload:
                return self._json(403, {"ok": False, "msg": "bad token"})
            if device and payload.get("d") != device:
                return self._json(403, {"ok": False, "msg": "device mismatch"})
            with db() as conn:
                row = conn.execute(
                    "SELECT disabled FROM codes WHERE code=?", (payload.get("c"),)
                ).fetchone()
                if not row or row["disabled"]:
                    return self._json(403, {"ok": False, "msg": "revoked"})
            return self._json(200, {"ok": True, "exp": payload["exp"]})

        if path == "/v1/admin/issue":
            if not self._admin_ok():
                return self._json(401, {"ok": False, "msg": "unauthorized"})
            count = max(1, min(100, int(data.get("count") or 1)))
            max_devices = max(1, min(10, int(data.get("max_devices") or 1)))
            note = str(data.get("note") or "")[:200]
            now = int(time.time())
            codes = []
            with db() as conn:
                for _ in range(count):
                    code = (
                        "UJS-"
                        + secrets.token_hex(3).upper()
                        + "-"
                        + secrets.token_hex(3).upper()
                    )
                    conn.execute(
                        "INSERT INTO codes(code, note, max_devices, used_count, disabled, created_at) VALUES(?,?,?,?,0,?)",
                        (code, note, max_devices, 0, now),
                    )
                    codes.append(code)
                conn.commit()
            return self._json(200, {"ok": True, "codes": codes})

        return self._json(404, {"ok": False, "msg": "not found"})


def main():
    init_db()
    print(f"[ujs-act] listening on {HOST}:{PORT}")
    print(f"[ujs-act] admin key: {ADMIN_KEY}")
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
