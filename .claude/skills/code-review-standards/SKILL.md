---
name: code-review-standards
description: "Review checklist for changes to this repo. Use when reviewing a diff or pull request."
---

# Code review standards

Check in this order. Stop and report at the first blocker.

1. **Scope.** The change does what its task says. Nothing extra.
2. **Correctness.** Edge cases, errors and empty states are handled.
3. **Security.** No secrets in client code. No `innerHTML` with outside data. Paths and inputs validated.
4. **Boundaries.** Code sits in the module the architecture names. No new server or service.
5. **Tests.** New logic has tests. Existing tests still pass.
6. **Accessibility.** New UI meets the WCAG 2.2 AA checklist.
7. **Docs.** Facts in `docs/` still hold.

## Report format
- Blockers: must fix, with file and line.
- Should fix: real issues, not blocking.
- Notes: optional ideas. Keep few.

---
Shared by: software-architect, security-expert, qa-engineer, agent-console-engineer, frontend-engineer. Lead: software-architect.
