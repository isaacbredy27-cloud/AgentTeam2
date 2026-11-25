# 0004 · Stay on the Netlify Free plan for now

- Status: Accepted
- Date: 2026-11-25
- Decided by: project lead

## Context
Plan choice sets rate-limit rules and some function settings.

## Decision
Use the Netlify Free plan for now. Revisit when limits bite.

## Consequences
- Two rate-limit rules per project. Use them on `/api/login` and `/api/chat`.
- Other routes use a per-session budget stored in Netlify Blobs.
- Function region stays `cmh` (US East, Ohio). Memory stays 1024 MB.
- Background functions are available on Free. Long agent jobs still work.
- Fixed limits are the same on every plan: 60 s sync, 15 min background.
- Watch the plan's usage allowance in the Netlify dashboard.
