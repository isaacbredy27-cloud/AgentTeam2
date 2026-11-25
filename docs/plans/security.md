# Security plan

Owner: security-expert (Hollis). Date: 2026-11-25. Decision: 0006.

## Assets
`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, the `main` branch, admin sessions.

## Auth
- Browser: `@supabase/supabase-js`, PKCE flow. Email and password, plus Google.
- Public config (URL, anon key) comes from `GET /api/config`. Nothing Supabase-specific is in the repo or the bundle.
- Every console function reads `Authorization: Bearer <access token>`.
  It calls `GET {SUPABASE_URL}/auth/v1/user` with the anon key as `apikey`.
  Supabase checks signature, expiry and sign-out. This works for both legacy and asymmetric JWT keys.
- Role check: `user.app_metadata.role === "super_admin"`. Users cannot edit `app_metadata`.
  `user_metadata` is ignored. The client's view is ignored.
- No token: 401. Valid user, wrong role: 403. Supabase down: 503.
- Grant the role with SQL in the Supabase SQL editor (README).

## CSRF
Bearer tokens are not sent automatically, so classic CSRF does not apply.
Still: every POST must send JSON and, when `Origin` is present, it must equal the site origin.

## Path rules
Allow: `src/**`, `public/**`, `docs/**`, `tests/**`, `index.html`, and the page folders
`agents/index.html`, `how-it-works/index.html`, `resources/index.html`, `guide/index.html`, `offline.html`.
Deny always (deny wins): `netlify/**`, `netlify.toml`, `.claude/**`, `.github/**`, `package.json`,
`package-lock.json`, `.env*`, `*.pem`, `*.key`, `public/sw.js`, `scripts/**`, `vite.config.ts`.
Reject `..`, leading `/`, `//`, `\`, `%`, control characters and hidden segments.
Max 20 files, 200 KB per file, valid UTF-8 text.
Create must not exist. Update and delete must exist.

## Approve
Re-validate paths. Re-check base SHAs (stale → 409). Claim with `onlyIfMatch` (second approve → 409).
One commit through the Git Data API, `force: false`. Audit every proposal, approval and rejection.

## Secrets
- `ANTHROPIC_API_KEY` and `GITHUB_TOKEN`: Functions scope, Production context only.
- No `VITE_` secrets. A build check greps `dist/` for key patterns.
- Errors are generic. Logs never print tokens or prompts.
- Functions set their own security headers (`no-store`, `nosniff`, `no-referrer`).

## Rate limits
Free plan: 2 rules. `/api/chat` 20 per 60 s. `/api/proposals/:id/approve` 10 per 60 s.
Supabase rate-limits its own sign-in routes.

## Residual risks
- supabase-js keeps the session in localStorage. An XSS would expose it. The CSP blocks third-party script.
- Anyone can create a Supabase account unless sign-ups are turned off. The role gate still blocks them.
  Recommend turning off email sign-ups in Supabase.
