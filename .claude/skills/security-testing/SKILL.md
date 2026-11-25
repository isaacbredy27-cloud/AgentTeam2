---
name: security-testing
description: "Security test cases for console auth, path validation, approvals and secret leaks. Use when writing or running security tests."
---

# Security tests

- Login: right passes, wrong fails, lockout after 10 failures.
- Every `/api/*` route except login: 401 without a session.
- POST without `X-Console` or with a foreign `Origin`: 403.
- Path table, must deny: `../x`, `/etc/passwd`, `src/../netlify.toml`, `netlify/functions/chat.mts`,
  `.github/workflows/ci.yml`, `package.json`, `.env`, `public/sw.js`, `src\x.ts`, `src/%2e%2e/x`.
- Path table, must allow: `src/ui/topic.ts`, `docs/notes.md`.
- Over 20 files or over 200 KB: rejected.
- Approve twice: second fails. Changed base SHA: `stale`, no commit.
- No response contains an env value. Grep the JSON.
- `dist/` contains no key patterns.

---
Shared by: qa-engineer, security-expert. Lead: qa-engineer.
