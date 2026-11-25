# PWA plan

Owner: mobile-pwa-expert (Rowan). Date: 2026-11-25. Source: doc 02.

## Manifest
`public/manifest.webmanifest` as in doc 02 §2, with 192, 512 and maskable 512 icons.
Name stays "Trivia 50" until the lead picks one.

## Icons
`scripts/make-icons.mjs` renders one SVG to PNG with headless Chromium.
Sizes: 192, 512, maskable 512 (logo in the inner 80 %), 180 Apple touch icon, 32 favicon.

## Service worker (`public/sw.js`)
- `scripts/build-sw.mjs` injects the built file list and a version hash after `vite build`.
- Precache the shell: every page except `/agents/`, plus assets, icons and `offline.html`.
- Navigations: network first, then cache, then `offline.html`.
- `/agents/` and `/api/*`: network only. Never cached.
- `api_category.php`: stale-while-revalidate. Questions (`api.php`): network only.
- New worker waits. The page shows "A new version is ready." with a Reload button.
  `skipWaiting` runs only after the click.

## Install UX
- Android: catch `beforeinstallprompt`, show an Install button.
- iOS (not standalone): "To install, tap Share, then Add to Home Screen." Dismissible, remembered.
- Hide both in standalone mode.

## Offline
- Banner: "You're offline. New questions need a connection."
- The topic screen still shows cached categories and history. Start is disabled.
- `offline.html` covers pages that were never cached.
