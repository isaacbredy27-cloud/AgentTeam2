# Install prompts on Android and iOS

Sources (read 2026-11-25):
- https://web.dev/learn/pwa/installation-prompt
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

## Android and desktop Chromium
- `beforeinstallprompt` fires on `window` once the browser decides the app is installable.
- Call `e.preventDefault()` to stop the default mini-infobar, keep the event, show your own button.
- On click call `deferredPrompt.prompt()`. Then `await deferredPrompt.userChoice` → `outcome` is `'accepted'` or `'dismissed'`.
- The event does not fire when the app is already installed, fails the criteria, or cannot install on the device.
  "If the browser doesn't support the `beforeinstallprompt` or the event does not fire, there is no other way to trigger the browser's installation prompt."
- Where to prompt: "when your users are most engaged". Patterns: side menu, after a critical journey, after sign-up.
  For us: on the results screen after a finished round.

## iOS and iPadOS
- No prompt event. The user taps Share → Add to Home Screen.
- Show written instructions, and only in browser mode: `@media (display-mode: browser)`.
- With a manifest `display` of `standalone` or `fullscreen`, the icon opens as a Home Screen web app.
  Without one, iOS saves a plain bookmark.
- Web Push works only for Home Screen web apps (iOS/iPadOS 16.4+).
