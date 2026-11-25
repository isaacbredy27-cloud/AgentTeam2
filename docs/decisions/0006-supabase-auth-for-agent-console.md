# 0006 · Supabase Auth for the Agent Console

- Status: Accepted
- Date: 2026-11-25
- Decided by: project lead. Written by software-architect. Reviewed by security-expert.
- Supersedes: the password gate in doc 04 §7 ("Password gate") and `console-auth-sessions-csrf`.

## Context
Doc 04 planned one shared console password, a signed cookie and a lockout in Blobs.
The lead wants named accounts instead: email and password, plus "Continue with Google".
Only users with the role `super_admin` may use the Agents page and its functions.
This adds a new outside service. Decision 0001 requires a record for that.

## Decision
- Use **Supabase Auth** for console sign-in. Supabase holds no app data.
- The browser uses `@supabase/supabase-js` with the public project URL and anon key.
  A small function, `GET /api/config`, serves both from env vars. They are public values.
- Every console function reads `Authorization: Bearer <access token>`.
  It asks Supabase `GET /auth/v1/user` who the token belongs to.
  This checks signature, expiry and sign-out on the Supabase side.
- The role lives in `app_metadata.role`. Only the service role or SQL can set it. Users cannot.
  Functions never trust `user_metadata` or anything the client says.
- No token: 401. Signed in without `super_admin`: 403.
- The UI hides the console unless `/api/me` confirms `super_admin`. The server check is the real gate.
- `CONSOLE_PASSWORD_HASH`, `SESSION_SECRET` and the session store are dropped.
- Rate-limit rules move from `/api/login` to `/api/chat` and the approve route.

## Consequences
- New env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Functions scope, all contexts, public).
- Each console call costs one request to Supabase. Fine at console traffic.
- A Supabase outage blocks the console (503). Trivia is unaffected.
- The CSP `connect-src` adds `https://*.supabase.co`.
- The session lives in `localStorage` (supabase-js default). The CSP and `textContent` rendering guard against XSS.
- Admins are granted with SQL. Recommend turning off open sign-ups.
- New dependency `@supabase/supabase-js` (browser only). Reviewed by security-expert.
