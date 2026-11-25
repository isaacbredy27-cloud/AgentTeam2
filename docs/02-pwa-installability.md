# 02 · Installable PWA on iPhone and Android

Scope: what makes the app installable, platform differences, and when to use a native wrapper.

Sources, read 2026-11-25:

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: Web application manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)
- [MDN: Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [WebKit: Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
- [Capacitor](https://capacitorjs.com/)

## 1. Installability checklist

MDN lists these for Chromium browsers (Chrome, Edge, Samsung Internet):

- Serve over **HTTPS**. `localhost` and `127.0.0.1` also work in dev.
- Link a manifest: `<link rel="manifest" href="/manifest.webmanifest">`.
- Manifest has `name` or `short_name`.
- Manifest has `icons` with a **192px** and a **512px** icon.
- Manifest has `start_url`.
- Manifest has `display` or `display_override`.
- `prefer_related_applications` is `false` or absent.

MDN says a service worker is **not required** for installability.
We still ship one. It gives an offline app shell and faster loads.

Netlify serves every site over HTTPS. That covers the first item.

## 2. Manifest for this app

File: `public/manifest.webmanifest`. Serve it as `application/manifest+json`.

```json
{
  "id": "/",
  "name": "Trivia 50",
  "short_name": "Trivia",
  "description": "Pick a topic and answer 50 trivia questions.",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#1d4ed8",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Notes:

- `id` gives the app a stable identity. iOS 16.4+ also uses it.
- The name is a placeholder. The product owner picks the final name.
- A maskable icon keeps its shape on Android launchers. Keep the logo in the inner 80%.

Add these to `index.html` for iOS:

```html
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
<meta name="theme-color" content="#1d4ed8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

## 3. Android (Chrome)

- Chrome checks the criteria above. It then offers install in the URL bar or menu.
- On devices with Google Mobile Services, Chrome installs a **WebAPK**.
  The app gets a launcher icon, an app switcher entry and a settings entry.
- The `beforeinstallprompt` event fires when the app is installable.
  We can show our own "Install" button.

```js
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  showInstallButton();
});

installButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  hideInstallButton();
});
```

## 4. iPhone and iPad (iOS / iPadOS)

- There is **no `beforeinstallprompt`** on iOS.
- The user taps **Share → Add to Home Screen**.
- iOS 16.4+ allows this from Safari, Chrome, Edge, Firefox and Orion.
- A manifest with `display: "standalone"` or `"fullscreen"` makes it a Home Screen web app.
  Without one, iOS saves a plain bookmark.
- Home Screen web apps can use **Web Push** from iOS 16.4.
  Web Push does not work in a normal Safari tab on iOS.
- iOS 18.4 added **Declarative Web Push** for Home Screen apps.

What to build:

- Detect iOS Safari that is not in standalone mode.
- Show a short tip: "Tap Share, then Add to Home Screen."
- Hide the tip once `matchMedia('(display-mode: standalone)')` matches.
- Let the user dismiss it. Remember the choice.

Storage caution: Safari may clear site data for sites not used for a while.
Keep scores small. Treat them as nice-to-have, not critical data.
Call `navigator.storage.persist()` where it exists. It may be refused.

## 5. Service worker plan

File: `public/sw.js`, registered from the app root so its scope is `/`.

Strategies:

| Request | Strategy | Why |
| --- | --- | --- |
| App shell (HTML, JS, CSS, icons) | Precache on `install`; cache-first | Works offline. Loads fast. |
| `api_category.php` | Stale-while-revalidate | List rarely changes. |
| `api.php` (questions) | Network only | Questions must be fresh and random. |
| `/api/*` (our functions) | Network only | Never cache chat, auth or commits. |

Update flow:

- Version the cache name, for example `shell-v3`.
- Delete old caches in `activate`.
- Show "New version available. Reload?" when a new worker is waiting.
- Call `skipWaiting()` only after the user agrees. This avoids mixed versions.

Serve `sw.js` with `Cache-Control: no-cache`. See doc 03 for the header rule.

Background sync and periodic sync are Chromium-only. This app does not need them.

## 6. PWA or native wrapper?

Default: **ship as a PWA.** It meets every stated need.

Consider [Capacitor](https://capacitorjs.com/) only if one of these becomes a must:

- A listing in the Apple App Store or Google Play.
- Native APIs the web lacks on iOS. Examples: in-app purchases, HealthKit, widgets.
- Push on iOS for users who will not add the app to the Home Screen.
- Reliable background work on iOS.

Capacitor wraps the same web build. Setup is short:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

```bash
npx cap init
```

```bash
npx cap add ios
```

```bash
npx cap add android
```

Costs of wrapping:

- Apple developer account and Xcode on a Mac. Google Play account.
- App review cycles. Updates to native shells need a new store release.
- Apple may reject thin wrappers that add nothing over the website.
  This is App Store Review Guideline 4.2, "Minimum Functionality".
- The Agent Console should never ship inside a store build.

Decision rule: start as a PWA. Revisit only with a concrete store or API need.

## 7. Installability test steps

- Chrome DevTools → Application → Manifest. Check for errors.
- Chrome DevTools → Application → Service workers. Test "Offline".
- Android phone: open the Netlify URL in Chrome. Install. Launch from the icon.
- iPhone: open in Safari. Share → Add to Home Screen. Launch. Check it opens without browser UI.
- Re-test after each service worker change.
