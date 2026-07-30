# OCAP static-ui (UKSF embed patches)

Custom OCAP web frontend for `aar.uk-sf.co.uk`. Upstream binary embeds its own UI; we override with `setting.json` → `"static": "static-ui"`.

## Why

1. Steam OpenID cannot run inside the UKSF iframe (Steam `frame-ancestors`).
2. UKSF already knows the member Steam ID — mints an OCAP JWT (`GET /ocap/embed-token`) and `postMessage`s it into the iframe.
3. Standalone `https://aar.uk-sf.co.uk` still uses normal Steam sign-in.

## After an OCAP upstream upgrade

```bash
# from a clean machine with Node >= 24
./rebuild.sh v2.1.1   # tag matching installed OCAP web
# scp dist/* to uksf-server:C:/Server/OCAP/static-ui/
# Restart-Service OCAP
# keep setting.json "static": "static-ui"
```

`patches/` holds the modified source files copied over the upstream tree before `npm run build`.

Do **not** replace `data/`, `data.db`, `maps/`, or `setting.json` secret/auth when upgrading the OCAP binary.
