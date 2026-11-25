# Worked example: routing a handoff

## An expert's reply ends with
```
## Handoff
security-expert: review netlify/functions/approve.mts — new GitHub commit path; check token use and path validation.
qa-engineer: add tests for approve twice (second must fail) and stale base SHA.
netlify-engineer: add WORKER_SECRET to Production env vars, Functions scope.
```

## What the orchestrator does
1. Starts security-expert and qa-engineer **in parallel**. They read different files and write different files.
2. Does **not** start netlify-engineer yet. Adding a secret touches production config. Asks the human first:
   "netlify-engineer needs to add WORKER_SECRET to Production. OK to proceed?"
3. Pastes the needed context into each new prompt: file path, what changed, and the acceptance check.
4. Collects both replies. If security-expert blocks, routes the fix back to agent-console-engineer with the exact finding.

## What the orchestrator never does
- Let agent-console-engineer message security-expert directly.
- Approve the proposal or push to `main` on its own.
