# Activation API

Stdlib-only HTTP service for UJSCOURSE license codes.

## Deploy

```bash
# on server
mkdir -p /opt/ujs-act
# copy app.py here
systemctl enable --now ujs-act.service
```

Public entry (this host): `http://<ip>/ujs-act/` (proxied from port 80).

## Issue codes

```bash
ADMIN=$(sed -n '2p' /opt/ujs-act/.runtime_secret)
curl -s -X POST http://127.0.0.1:8787/v1/admin/issue \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN" \
  -d '{"count":5,"note":"qq-user"}'
```

Do not commit `.runtime_secret` or `activate.db`.
