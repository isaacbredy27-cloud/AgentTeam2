---
name: team-planning-and-routing
description: "Break goals into owned tasks, run independent tasks in parallel, and route handoffs between experts. Use when planning work or assigning it to agents."
---

# Planning, task breakdown and routing

## Task format
Every task has: goal, owner agent, inputs, files it may touch, acceptance criteria, reviewers.

## Routing
- Pick the owner from the roster in `docs/expert-roster.md`, section 2.
- Pick reviewers from section 6 of the roster, "Who reviews what".
- One owner per task. Reviewers never edit the same files at the same time.

## Parallel work
- Start independent tasks together, in one batch of Agent calls.
- Tasks are independent when they touch different files and need no output from each other.
- Run dependent tasks in order. Pass the earlier result into the later prompt.
- Never let two agents edit the same file at once.

## Handoffs
- Experts do not call each other. They end their reply with a `## Handoff` section.
- Read every `## Handoff` section. Turn each item into a new task for the named agent.
- Include the full context the next agent needs. Agents start without your history.

## Done
- A task is done when its acceptance criteria pass and its reviewers agree.
- Escalate to the human when experts disagree, a decision is missing, or scope changes.

---
Shared by: orchestrator, software-architect. Lead: orchestrator.
