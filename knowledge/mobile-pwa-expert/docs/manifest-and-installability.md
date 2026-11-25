# Manifest and installability

Sources (read 2026-11-25):
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest

## Chromium install criteria (MDN)
- `name` or `short_name`.
- `icons` with a 192px and a 512px icon.
- `start_url`.
- `display` and/or `display_override`.
- `prefer_related_applications` is `false` or absent.
- Served over `https`, or from `localhost` / `127.0.0.1` in development.
- A service worker is "not a requirement for a PWA to be installable". We ship one for offline use.

## Linking and type
- `<link rel="manifest" href="/manifest.webmanifest">`.
- Extension `.webmanifest` (also `.json`). MIME type `application/manifest+json`.

## Members we use
`id`, `name`, `short_name`, `description`, `start_url`, `scope`, `display`, `orientation`,
`background_color`, `theme_color`, `icons` (with `purpose: "maskable"` for one icon).
Other members exist: `display_override`, `screenshots`, `shortcuts`, `categories`, `share_target`, and more.

## Platforms
- Android Chrome with Google Mobile Services installs a **WebAPK**: launcher icon, app switcher and settings entry.
- iOS 16.3 and earlier: install only from Safari. iOS 16.4+: from the Share menu in Safari, Chrome, Edge, Firefox and Orion.
- `beforeinstallprompt` is not supported on iOS.
