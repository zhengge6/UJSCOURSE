# Activation API

Stdlib-only HTTP service for UJSCOURSE license codes.

## Deploy

```bash
# on server
mkdir -p /opt/ujs-act/web
# copy app.py + web/* here
# optional: /opt/ujs-act/admin.env with UJS_ADMIN_PASSWORD=...
systemctl enable --now ujs-act.service
```

Public entry: `http://<ip>/ujs-act/`  
Admin UI: `http://<ip>/ujs-act/admin` (password via `UJS_ADMIN_PASSWORD` / admin key)

## Issue codes

Prefer the `/admin` page. CLI:

```bash
curl -s -X POST http://127.0.0.1:8787/v1/admin/issue \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $UJS_ADMIN_PASSWORD" \
  -d '{"count":5,"note":"user"}'
```

Do not commit `.runtime_secret`, `admin.env`, or `activate.db`.
