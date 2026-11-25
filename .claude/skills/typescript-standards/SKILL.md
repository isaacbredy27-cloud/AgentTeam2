---
name: typescript-standards
description: "TypeScript conventions for app and function code. Use when writing or reviewing any .ts or .mts file."
---

# TypeScript standards

- `strict: true`. No `any`. Use `unknown` and narrow.
- ES modules. Functions use `.mts`.
- Validate all outside data at the edge: API replies, request bodies, storage reads.
- Return typed results; throw only for programmer errors.
- Small modules with one job. Export pure functions where possible.
- Name files in kebab-case. Name types in PascalCase.
- No default exports in `src/`, except where a tool requires one (Netlify functions).
- Use web APIs (`fetch`, `Request`, `Response`, `crypto.randomUUID`) over Node-only ones where both work.

---
Shared by: frontend-engineer, opentdb-integration-expert, mobile-pwa-expert, agent-console-engineer, netlify-engineer, qa-engineer. Lead: frontend-engineer.
