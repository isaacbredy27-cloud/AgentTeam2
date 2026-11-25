# Research notes: Trivia PWA with an Agent Console

These notes are context for the agent team that will build the app.
Research date: 2026-11-25. Each file lists the official sources it used.

## The product

- A mobile-friendly trivia app. Users can install it on their phone.
- Users pick a topic and get 50 random questions from Open Trivia DB.
- Users answer, track their score and see results at the end.
- Hosted on Netlify. Static site plus a few Netlify Functions.
- An **Agent Console** page lists the agents in `.claude/agents`.
  Users chat with an agent. Agents propose code changes.
  A change is committed to GitHub only after a human clicks **Approve**.
  The commit triggers a Netlify redeploy.

## Files

| # | File | Topic |
| --- | --- | --- |
| 01 | [01-trivia-opentdb.md](01-trivia-opentdb.md) | Open Trivia DB: categories, 50 questions, encoding, answer choices, scoring, rate limits |
| 02 | [02-pwa-installability.md](02-pwa-installability.md) | Manifest, service worker, iPhone vs Android install, when to use Capacitor |
| 03 | [03-netlify-architecture.md](03-netlify-architecture.md) | Repo layout, functions, limits, env vars, Blobs, rate limits, deploys |
| 04 | [04-agent-console.md](04-agent-console.md) | Agent list, chat via Claude API, propose and approve flow, security, long jobs |
| 05 | [05-testing-accessibility.md](05-testing-accessibility.md) | Test layers, security tests, Playwright, WCAG 2.2 AA checklist |
| — | [expert-roster.md](expert-roster.md) | The 12-agent team, job lines, shared skills and review owners |
| — | [decisions/](decisions/README.md) | Decision records |
| — | [agent-brains.md](agent-brains.md) | Each agent's model, name and personality |
| — | [../knowledge/](../knowledge/README.md) | Per-agent reference notes and runnable worked examples |

The team itself lives in `.claude/agents/` and `.claude/skills/`. See `CLAUDE.md` at the repo root.

## Key decisions

1. **The trivia game is fully static.** The browser calls Open Trivia DB directly.
   A shared function IP would hit the 5-second rate limit for every user.
2. **PWA first.** No native wrapper unless a store listing or a missing web API becomes a must.
3. **Functions only for the Agent Console.** They hold every secret.
4. **Agents propose; humans approve.** The model never gets the GitHub token or a write tool.
5. **One fine-grained GitHub token, one repo, Contents write only.**
6. **Strict path rules.** Agents cannot touch functions, config, agent files, CI, dependencies or the service worker.
7. **Long jobs run as background functions** with polling. Up to 15 minutes, built to survive retries.
8. **Default model `claude-opus-5-5`.** Agents may pick `sonnet` or `haiku` in their frontmatter.

## Hard numbers to remember

| Limit | Value | Source doc |
| --- | --- | --- |
| Questions per OpenTDB call | 50 max | 01 |
| OpenTDB rate limit | 1 call per 5 s per IP | 01 |
| OpenTDB session token idle expiry | 6 hours | 01 |
| Netlify sync and streaming function time | 60 s | 03 |
| Netlify background function time | 15 min | 03 |
| Netlify background payload | 256 KB | 03 |
| Netlify buffered payload | 6 MB | 03 |
| Netlify streamed response | 20 MB | 03 |
| Netlify rate-limit window | max 180 s | 03 |
| Netlify Blobs eventual-consistency delay | up to 60 s | 03 |
| GitHub Contents API read, full support | files ≤ 1 MB | 04 |
| PWA icon sizes (Chromium) | 192 px and 512 px | 02 |

## Decisions taken (2026-11-25)

Full records live in [decisions/](decisions/README.md).

- **0001** Static PWA on Netlify plus Functions. No other servers.
- **0002** No proxy for Open Trivia DB. The browser calls it directly.
- **0003** Approve commits straight to `main`. No pull request.
- **0004** Netlify Free plan for now.
- **0005** Fine-grained personal access token for GitHub.

## Open questions for the team

- Does Open Trivia DB send CORS headers? Check in the first spike (doc 01, section 9).
  With no proxy (decision 0002), a CORS failure goes back to the lead.
- Final app name, colours and icons.
- Should scores sync across devices? v1 keeps them on the device only.

## Suggested agent roles

Superseded by [expert-roster.md](expert-roster.md). Kept for history.

| Agent | Focus | Main docs |
| --- | --- | --- |
| `product-lead` | Scope, user stories, acceptance criteria | README |
| `frontend-dev` | Trivia screens, state, OpenTDB client | 01, 05 |
| `pwa-engineer` | Manifest, service worker, install UX | 02 |
| `platform-engineer` | Netlify config, functions, Blobs, deploys | 03 |
| `security-engineer` | Console auth, path rules, token scope, reviews | 04 |
| `ai-integration-dev` | Claude API chat, tools, streaming, background jobs | 04 |
| `qa-accessibility` | Tests, axe, device checks | 05 |

## Sources (official docs)

- Open Trivia DB API: <https://opentdb.com/api_config.php>
- MDN Progressive web apps: <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps>
- WebKit blog on Home Screen web apps: <https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/>
- Netlify Functions: <https://docs.netlify.com/build/functions/overview/>
- Netlify function limits: <https://docs.netlify.com/build/functions/configuration/>
- Netlify Background Functions: <https://docs.netlify.com/build/functions/background-functions/>
- Netlify env vars for functions: <https://docs.netlify.com/build/functions/environment-variables/>
- Netlify Blobs: <https://docs.netlify.com/build/data-and-storage/netlify-blobs/>
- Netlify rate limiting: <https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/>
- Claude API docs: <https://platform.claude.com/docs>
- GitHub repository contents API: <https://docs.github.com/en/rest/repos/contents>
- GitHub fine-grained tokens: <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens>
- Capacitor: <https://capacitorjs.com/>

Note: the "Vibe Coding API Directory" at mcp-api.netlify.app lists Open Trivia DB.
All API facts here come from opentdb.com itself.
