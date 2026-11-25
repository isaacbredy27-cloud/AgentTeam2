---
name: threat-modelling
description: "Threat model for the trivia PWA and the Agent Console. Use when designing a feature that touches secrets, auth, commits or outside data."
---

# Threat model

## Assets
Claude API key, GitHub token, console password, the `main` branch, user scores.

## Threats and controls
| Threat | Control |
| --- | --- |
| Stolen API key or token | Only in function env vars; Production only; never logged or returned |
| Console brute force | scrypt hash, rate limit 5/min, lockout after 10 failures |
| CSRF on Approve | `SameSite=Strict`, custom header, `Origin` check |
| Malicious agent change | Allow-list, deny-list, full diff, human Approve |
| Prompt injection | Agent output untrusted; model has no write tool |
| XSS from trivia or agent text | `textContent` only; strict CSP |
| Runaway spend | Rate limits, per-session budget, `max_tokens`, Anthropic spend limit |
| Double or stale commit | `onlyIfMatch` on status; base SHA check |

## Process
For each new feature: list new assets and entry points, then map each to a control.

---
Shared by: security-expert, software-architect, agent-console-engineer. Lead: security-expert.
