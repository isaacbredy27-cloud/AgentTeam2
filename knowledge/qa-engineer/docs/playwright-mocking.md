# Playwright: mock APIs

Source: https://playwright.dev/docs/mock (read 2026-11-25)

```ts
await page.route('*/**/api/v1/fruits', async route => {
  const json = [{ name: 'Strawberry', id: 21 }];
  await route.fulfill({ json });
});
```
- Register the route **before** `page.goto`.
- Patch a real response: `const response = await route.fetch(); ... await route.fulfill({ response, json });`
- Replay from a HAR file: `await page.routeFromHAR('./hars/fruit.har', { url: '*/**/api/v1/fruits', update: false });`

## Rules for this project
- Mock `https://opentdb.com/**` and `/api/**` in every e2e test. Never hit real services in CI.
- A fulfilled cross-origin response still goes through CORS in the browser.
  Add `headers: { 'access-control-allow-origin': '*' }` when mocking opentdb.com.
