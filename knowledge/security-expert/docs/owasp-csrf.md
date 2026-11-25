# OWASP: Cross-Site Request Forgery Prevention

Source: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html (read 2026-11-25)

- **Custom request headers** suit APIs. Browsers preflight cross-origin requests that carry custom headers.
  "When the API verifies that the custom header is there, you know that the request must have been preflighted if it came from a browser."
- **SameSite**: `Strict` blocks the cookie on all cross-site requests, even top-level links. `Lax` allows safe-method top-level navigations.
  OWASP treats SameSite as defence in depth, not the only defence.
- **Origin / Referer check**: compare the source origin with the target origin. Browsers set these headers; scripts cannot.
- **Fetch Metadata**: reject non-safe methods when `Sec-Fetch-Site: cross-site`. Allow `same-origin`.
  Fall back to origin checks when `Sec-Fetch-*` headers are absent.
- **Signed double-submit cookie**: HMAC-SHA-256 over the session-bound value with a server secret.

## How we apply it
Every console POST must pass all of: session cookie with `SameSite=Strict`, header `X-Console: 1`,
`Origin` equal to the site URL, and `Sec-Fetch-Site` not equal to `cross-site` when present.
