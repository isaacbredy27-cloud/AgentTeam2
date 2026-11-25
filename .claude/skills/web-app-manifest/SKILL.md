---
name: web-app-manifest
description: "Manifest fields, icons and install criteria for Android and iOS. Use when changing the manifest, icons or install UX."
---

# Web app manifest and installability

## Chromium install criteria
- HTTPS (Netlify provides it).
- `<link rel="manifest" href="/manifest.webmanifest">`.
- `name` or `short_name`; `icons` with 192 px and 512 px; `start_url`; `display`.
- `prefer_related_applications` false or absent.
- A service worker is not required to install. We ship one anyway.

## Our manifest
- `id: "/"`, `scope: "/"`, `display: "standalone"`, portrait.
- Add a maskable 512 px icon. Keep the logo in the inner 80%.
- Serve as `application/manifest+json`.

## iOS
- Add `<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">`.
- No `beforeinstallprompt`. Show a "Share, then Add to Home Screen" tip.
- Hide the tip when `display-mode: standalone` matches.

## Android
- Listen for `beforeinstallprompt`, call `preventDefault()`, show our Install button.

Details: `docs/02-pwa-installability.md`.

---
Shared by: mobile-pwa-expert, ux-designer-apple-hig, netlify-engineer. Lead: mobile-pwa-expert.
