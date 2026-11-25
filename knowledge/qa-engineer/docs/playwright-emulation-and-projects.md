# Playwright: emulation and device projects

Source: https://playwright.dev/docs/emulation (read 2026-11-25)

```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
});
```
- Set `viewport` **after** spreading `devices[...]`, "since devices also define the `viewport`".
- Offline: `use: { offline: true }` or `await context.setOffline(true)`.
- `locale`, `timezoneId`, `colorScheme: 'dark'`, `reducedMotion: 'reduce'` in `use` or `browser.newContext({...})`.

## Facts checked in this repo (2026-11-25, @playwright/test 1.63.0)
- `devices['iPhone 15']` → WebKit, viewport 393×659. `devices['Pixel 7']` → Chromium, viewport 412×839.
- This cloud container has only Chromium installed. iPhone projects need WebKit (`npx playwright install webkit`) in CI.
