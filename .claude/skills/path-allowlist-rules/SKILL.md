---
name: path-allowlist-rules
description: "Which repo paths agents may change through the console, and how to validate them. Use when validating proposals or editing the path rules."
---

# Path allow-list and deny-list

## Allowed
`src/**`, `public/**` (not `public/sw.js`), `docs/**`, `tests/**`, `index.html`

## Always denied (deny wins)
`netlify/functions/**`, `netlify.toml`, `.claude/**`, `.github/**`,
`package.json`, `package-lock.json`, `.env*`, `*.pem`, `*.key`, `public/sw.js`

## Validation
- Normalize with POSIX rules. Reject if the result differs from the input.
- Reject `..`, leading `/`, `\`, `//`, `%2e`, null bytes, control characters.
- Reject hidden segments starting with `.` unless explicitly allowed.
- Max 20 files per proposal. Max 200 KB per file. Text only, valid UTF-8.
- `create` fails if the file exists. `update` and `delete` fail if it does not.

The lists live in `netlify/functions/`, which agents cannot change from the console.

---
Shared by: security-expert, agent-console-engineer, meta-agent, qa-engineer. Lead: security-expert.
