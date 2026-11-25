---
name: console-auth-sessions-csrf
description: "Password gate, session cookies and CSRF checks for the Agent Console. Use when building or testing login, logout or any POST route."
---

# Console auth, sessions and CSRF

## Login
- Compare scrypt(password, salt) with `CONSOLE_PASSWORD_HASH` using `crypto.timingSafeEqual`.
- Rate limit 5 per 60 s per IP. Lock for 15 min after 10 failures (track in Blobs).
- Generic error: "Wrong password." Never say which part failed.

## Session
- Cookie: `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800`.
- Value: session ID plus HMAC-SHA256 with `SESSION_SECRET`.
- Also store the session in Blobs so logout revokes it.

## Every protected route
- Valid session, else 401.
- POST also needs header `X-Console: 1` and `Origin` equal to the site URL, else 403.

---
Shared by: security-expert, agent-console-engineer, qa-engineer. Lead: security-expert.
