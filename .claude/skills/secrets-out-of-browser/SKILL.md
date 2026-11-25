---
name: secrets-out-of-browser
description: "Rules that keep keys and tokens out of client code, logs and responses. Use when touching env vars, builds, logs or API responses."
---

# Keeping secrets out of the browser

- Secrets exist only in Netlify Function env vars.
- Never prefix a secret with `VITE_`. Only `VITE_` vars reach the bundle.
- Functions never return `process.env` or raw upstream errors.
- Logs never print tokens, cookies, password hashes or full prompts.
- CI greps `dist/` for key patterns such as `sk-ant-` and `github_pat_`. Any hit fails the build.
- `.env` is git-ignored.

---
Shared by: security-expert, netlify-engineer, agent-console-engineer, frontend-engineer. Lead: security-expert.
