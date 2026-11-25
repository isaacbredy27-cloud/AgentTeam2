---
name: ios-android-platform-behaviour
description: "Platform differences for installed web apps on iPhone and Android. Use when a feature or design depends on the device."
---

# iOS and Android platform behaviour

## iOS and iPadOS
- Install via Share → Add to Home Screen. iOS 16.4+ allows it from Safari, Chrome, Edge, Firefox, Orion.
- Manifest `display: standalone` makes it a Home Screen web app. Otherwise it is a bookmark.
- Web Push works only for Home Screen web apps (iOS 16.4+). Declarative Web Push from 18.4.
- No `beforeinstallprompt`.
- Safari may clear storage of sites not used for a while. Treat local scores as nice-to-have.

## Android
- Chrome installs a WebAPK on devices with Google services. It gets a launcher icon.
- `beforeinstallprompt` enables a custom Install button.

## Native wrapper
- Stay a PWA. Consider Capacitor only for a store listing or a missing web API.
- Apple may reject thin wrappers (guideline 4.2). Never ship the Agent Console in a store build.

---
Shared by: mobile-pwa-expert, ux-designer-apple-hig, ui-designer-apple-liquid-glass, qa-engineer. Lead: mobile-pwa-expert.
