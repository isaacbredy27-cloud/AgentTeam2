# Custom headers and rate limiting

Sources (read 2026-11-25):
- https://docs.netlify.com/manage/routing/headers/
- https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/

## Headers
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
```
- A `_headers` file in the publish folder works too.
- Wildcards `*` match within a segment; `:placeholders` only at a segment start.
- **"Custom headers apply only to files Netlify serves from our own backing store."**
  Function and proxied responses do not get them. Functions must set their own security headers.

## Rate limits
- Set in the function's `config.rateLimit`. A `path` is required. Not settable in `netlify.toml` for functions.
- `windowLimit`, `windowSize` (seconds, max 180), `aggregateBy` (`ip`, `domain`), optional `action: "rewrite"` with `to`.
- Blocked requests get HTTP 429.
- Rules per project: Free/Starter/Personal 2, Pro 5, Enterprise with HP Edge 100.
