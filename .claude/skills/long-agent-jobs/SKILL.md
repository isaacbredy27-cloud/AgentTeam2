---
name: long-agent-jobs
description: "Run agent work longer than 60 seconds as Netlify background functions with polling. Use when a console task may exceed the sync limit."
---

# Long agent jobs

## Limits
- Sync and streaming functions: 60 s.
- Background functions: 15 min. Payload 256 KB. Client gets 202.
- Failed background runs retry after 1 min, then 2 min.

## Pattern
1. `POST /api/jobs` creates `jobs/<id>` in Blobs, status `queued`.
2. It calls `/api/jobs-worker` with the job ID and `WORKER_SECRET`.
3. Worker claims the job with `onlyIfMatch`, sets `running`.
4. Worker streams Claude output, writes progress to Blobs every few seconds.
5. Worker sets `done`, `partial` or `error`.
6. Browser polls `GET /api/jobs/<id>` every 2–3 s.

## Idempotency
- Worker exits if the job is not `queued`.
- Proposals from jobs stay `pending`. A retry can never commit.

## Time budget
- Start no new Claude call after ~13 minutes. Save and mark `partial`.
- Longer work: split into steps, one job per step.

---
Shared by: agent-console-engineer, netlify-engineer, software-architect. Lead: agent-console-engineer.
