---
name: unit-and-function-testing
description: "Vitest unit tests and Netlify Function tests with fakes for Claude, GitHub and Blobs. Use when writing or running unit or function tests."
---

# Unit and function tests (Vitest)

## Unit
- Decode, shuffle, scoring, streaks, storage failure, OpenTDB codes 0–5.
- Code 1 path and code 5 wait (use fake timers).
- Fixtures for OpenTDB. Never call the real API in CI.

## Functions
- Call handlers with real `Request` objects.
- Fakes: scripted Claude stream (including `tool_use`), recording `fetch` for GitHub (200, 201, 409, 422), in-memory Blobs with `onlyIfMatch`.
- Model alias map: `opus`, `sonnet`, `haiku`, `inherit`, unknown.
- Background worker exits on a second run for the same job.

Run `npm test` before every handoff.

---
Shared by: qa-engineer, frontend-engineer, opentdb-integration-expert, agent-console-engineer. Lead: qa-engineer.
