---
name: agent-evaluation
description: "Test agents on sample tasks and fix weak prompts or skills. Use when an agent misroutes, misses rules or produces weak work."
---

# Evaluating and improving agents

## Test set
- Keep 3–5 sample tasks per agent in `docs/agent-evals/<agent>.md`.
- Each task has an input and pass criteria a reviewer can check.

## Loop
1. Run the agent on each sample task.
2. Score each criterion pass or fail. Note the failure cause.
3. Fix the smallest thing: description, one prompt line, or one skill line.
4. Re-run the full set. Keep the change only if nothing regresses.

## Common fixes
- Wrong agent picked: sharpen the `description`.
- Rule ignored: move it higher in the body, state it once, plainly.
- Prompt grew long: delete stale or duplicate lines first.

Record each change and its result in the eval file.

---
Shared by: meta-agent, orchestrator, qa-engineer. Lead: meta-agent.
