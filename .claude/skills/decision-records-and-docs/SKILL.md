---
name: decision-records-and-docs
description: "Write and update decision records in docs/decisions and keep docs/ current. Use when a decision is made or a doc goes stale."
---

# Decision records and docs upkeep

## Decision records
- One file per decision: `docs/decisions/NNNN-short-title.md`.
- Sections: Status, Date, Context, Decision, Consequences.
- Status is `Accepted`, `Superseded by NNNN` or `Proposed`.
- Never edit an accepted record's decision. Supersede it with a new one.

## Docs upkeep
- `docs/README.md` is the index. Link every new doc from it.
- When code changes a fact in `docs/01`–`05`, update the doc in the same change.
- Date any fact that can change, such as limits or prices.
- Write short, plain sentences in active voice.

---
Shared by: orchestrator, software-architect, meta-agent. Lead: software-architect.
