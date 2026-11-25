---
name: netlify-headers-csp-rate-limits
description: "netlify.toml headers, the Content Security Policy and function rate-limit config. Use when changing headers, CSP or rate limits."
---

# Headers, CSP and rate limits

## Headers (`netlify.toml`)
- `/sw.js`: `Cache-Control: no-cache`.
- `/manifest.webmanifest`: `Content-Type: application/manifest+json`.
- `/*`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- CSP: `default-src 'self'; connect-src 'self' https://opentdb.com; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'`.
- Any CSP change needs security review.

## Rate limits (in function `config`, not `netlify.toml`)
```ts
rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ["ip", "domain"] }
```
- `windowSize` max 180 s. Over the limit returns 429.
- Free plan: 2 rules. Use them on `/api/login` (5 per 60 s) and `/api/chat` (20 per 60 s).

---
Shared by: netlify-engineer, security-expert, mobile-pwa-expert. Lead: netlify-engineer.
