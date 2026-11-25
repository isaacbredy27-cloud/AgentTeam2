# 0002 · No proxy for Open Trivia DB

- Status: Accepted
- Date: 2026-11-25
- Decided by: project lead

## Context
Open Trivia DB allows one call per 5 seconds per IP.
A server-side proxy would put every player behind a few shared function IPs.
They would hit the rate limit often.

## Decision
The browser calls Open Trivia DB directly. We build no proxy, cache or relay function for it.

## Consequences
- Each player uses their own IP and their own 5-second budget.
- The CSP allows `connect-src https://opentdb.com`.
- If Open Trivia DB ever blocks browser calls (CORS), the team stops and asks the lead.
  No agent adds a proxy on its own.
