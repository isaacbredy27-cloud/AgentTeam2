---
name: rate-limits-and-retries
description: "Retry and backoff rules for Open Trivia DB, the Claude API, GitHub and Netlify rate limits. Use when handling 429s, rate-limit codes or transient errors."
---

# Rate limits, retries and backoff

## General rules
- Retry only transient errors: rate limits, 5xx, network failures.
- Never retry 400, 401, 403, 404 or 422.
- Cap retries at 2–3. Use exponential backoff with jitter.
- Honour `retry-after` when present.
- One request in flight per resource from the client.

## Open Trivia DB
- Code 5 means wait at least 5 seconds. Enforce a 5 s gap in code.

## Claude API
- The SDK retries 408, 409, 429 and 5xx twice by default.
- Map remaining 429 or 5xx to "Busy, try again shortly".

## GitHub
- 409 on a commit means the branch moved. Re-check SHAs, retry once.
- 422 can mean spam protection. Do not loop.

## Netlify rate-limit rules
- Free plan allows 2 rules per project: `/api/login` and `/api/chat`.
- Over the limit, Netlify returns 429.
- Other routes use a per-session budget in Netlify Blobs.

---
Shared by: opentdb-integration-expert, agent-console-engineer, netlify-engineer, security-expert. Lead: opentdb-integration-expert.
