---
name: netlify-env-and-secrets
description: "Environment variables, scopes and deploy contexts for the console's secrets. Use when adding, rotating or reading a secret."
---

# Env vars and secrets

| Name | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API |
| `GITHUB_TOKEN` | Fine-grained token, one repo |
| `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` | Commit target (`main`) |
| `CONSOLE_PASSWORD_HASH` | scrypt hash of the console password |
| `SESSION_SECRET` | Signs session cookies |
| `WORKER_SECRET` | Authenticates calls to the background worker |

## Rules
- Scope must include Functions. Read with `process.env.NAME`.
- Set in the Netlify UI, CLI or API. Never in `netlify.toml`.
- Values apply at deploy time. Redeploy after a change.
- Secrets in the Production context only. Deploy Previews get none.
- Local dev: git-ignored `.env`. Never commit it.
- Rotate the GitHub token before it expires (90 days or less).

---
Shared by: netlify-engineer, security-expert, agent-console-engineer. Lead: netlify-engineer.
