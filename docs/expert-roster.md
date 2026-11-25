# Expert roster: Trivia PWA team

Decision on record: the Trivia App is a PWA on Netlify.
It has a static front end and Netlify Functions for the Claude and GitHub calls.
There are no other servers.

This roster lists the agents needed to design, build, test and deploy the app.
It also covers running the Agent Console.
Each agent is a project subagent at `.claude/agents/<slug>.md`. How they work together: see `CLAUDE.md`.

Background research: see [README.md](README.md) and docs 01–05.

## 1. The team (12 agents)

Eleven roles are required. One more is added because the app needs it (see section 3).

| # | Agent (slug) | Name | Job, in one line | Model |
| --- | --- | --- | --- | --- |
| 1 | `orchestrator` | Juno | Runs the team: splits work, assigns it, tracks it and merges results. | opus |
| 2 | `meta-agent` | Iris | Builds, tests and improves the other agent files in `.claude/agents`. | sonnet |
| 3 | `software-architect` | Atlas | Owns the system design, module boundaries and decision records. | opus |
| 4 | `opentdb-integration-expert` | Pip | Builds the Open Trivia DB client: categories, 50 questions, tokens, rate limits. | haiku |
| 5 | `mobile-pwa-expert` | Rowan | Makes the app installable and offline-ready on iPhone and Android. | sonnet |
| 6 | `security-expert` | Hollis | Guards secrets, the console login, the token scope and the path rules. | opus |
| 7 | `agent-console-engineer` | Orin | Builds the console: Claude chat, proposals and approved GitHub commits in Functions. | opus |
| 8 | `ui-designer-apple-liquid-glass` | Sable | Designs the visual layer in an Apple Liquid Glass style. | sonnet |
| 9 | `ux-designer-apple-hig` | Wren | Designs flows and interactions that follow Apple's Human Interface Guidelines. | sonnet |
| 10 | `qa-engineer` | Tess | Writes and runs unit, function, end-to-end and accessibility tests. | sonnet |
| 11 | `netlify-engineer` | Nico | Owns `netlify.toml`, functions config, env vars, Blobs, rate limits and deploys. | sonnet |
| 12 | `frontend-engineer` | Kit | Builds the trivia screens, game state, scoring and results in TypeScript. | sonnet |

Model column: the `model` value for each agent file.
`opus` maps to `claude-opus-5-5`, `sonnet` to `claude-sonnet-5-5`, `haiku` to `claude-haiku-5-5` (doc 04, section 2).
Opus goes to hard reasoning where mistakes are costly. Sonnet goes to everyday engineering and design.
Haiku goes to small, well-defined jobs. Names, personalities and the reasons: [agent-brains.md](agent-brains.md).

## 2. Role details

### 1. Orchestrator — `orchestrator`

Runs the team: splits work, assigns it, tracks it and merges results.

- Turns goals into tasks with clear owners and acceptance criteria.
- Sends each task to the right expert. Collects and checks the result.
- Keeps the plan, the open questions and the decision log current.
- Asks the human for decisions it cannot make.
- Never approves commits. Approve stays a human click.

### 2. Meta agent — `meta-agent`

Builds, tests and improves the other agent files in `.claude/agents`.

- Writes each agent's frontmatter (`name`, `description`, `model`) and system prompt.
- Keeps prompts short, current and free of conflicts.
- Tests agents on sample tasks. Fixes weak spots.
- Checks the console can parse every file.
- Proposes changes only. `.claude/**` is on the console deny-list, so edits go through normal Git review.

### 3. Software architect — `software-architect`

Owns the system design, module boundaries and decision records.

- Keeps the static-plus-Functions design simple. No new servers.
- Defines folder layout, module APIs and data shapes.
- Writes short decision records in `docs/decisions/`.
- Reviews designs and large pull requests for fit.

### 4. API integration expert — `opentdb-integration-expert`

Builds the Open Trivia DB client: categories, 50 questions, tokens, rate limits.

- Implements `src/api/opentdb.ts` per doc 01.
- Handles response codes 0–5, session tokens and the 5-second limit.
- Handles categories with fewer than 50 questions.
- Decodes `url3986` text. Never uses `innerHTML`.
- Settles the CORS open question in the first spike.

### 5. Mobile/PWA expert — `mobile-pwa-expert`

Makes the app installable and offline-ready on iPhone and Android.

- Owns the manifest, icons and `sw.js`.
- Sets the caching plan and the update prompt.
- Builds the Android install button and the iOS "Add to Home Screen" tip.
- Tests installs on real devices.
- Judges when a native wrapper such as Capacitor would be needed.

### 6. Security expert — `security-expert`

Guards secrets, the console login, the token scope and the path rules.

- Owns the threat model for the Agent Console.
- Specifies the password gate, sessions, CSRF checks and CSP.
- Defines the GitHub token scope and the path allow-list and deny-list.
- Reviews every change to `netlify/functions/` and `netlify.toml`.
- Checks that no secret reaches the browser bundle.

### 7. Agent-console engineer — `agent-console-engineer`

Builds the console: Claude chat, proposals and approved GitHub commits in Functions.

- Builds `/api/agents`, `/api/chat`, proposals, approve, reject and jobs.
- Calls the Claude API with streaming and the `propose_change` tool.
- Commits approved changes with the GitHub REST API.
- Runs long jobs as background functions with polling.
- Builds the console UI with the designers.

### 8. UI designer — `ui-designer-apple-liquid-glass` (Sable)

Designs the visual layer in an Apple Liquid Glass style.

- Defines design tokens: colour, type, spacing, radius, blur and depth.
- Designs translucent "glass" surfaces with CSS `backdrop-filter`.
- Keeps text contrast at WCAG AA on every glass layer.
- Gives solid fallbacks for `prefers-reduced-transparency` and older browsers.
- Supplies icons and the maskable app icon.

### 9. UX designer — `ux-designer-apple-hig` (Wren)

Designs flows and interactions that follow Apple's Human Interface Guidelines.

- Maps the flows: topic → 50 questions → results → play again.
- Sets touch targets, navigation, feedback and empty or error states.
- Designs the install tip and offline states.
- Designs the console flow: login, agent list, chat, diff, Approve.
- Writes the interface text in plain language.

### 10. QA engineer — `qa-engineer`

Writes and runs unit, function, end-to-end and accessibility tests.

- Owns the test plan in doc 05.
- Writes the security test table for paths, sessions and approvals.
- Runs Playwright on iPhone and Pixel presets, plus axe checks.
- Runs manual device and screen reader passes before release.
- Blocks a release when the definition of done is not met.

### 11. Netlify engineer — `netlify-engineer`

Owns `netlify.toml`, functions config, env vars, Blobs, rate limits and deploys.

- Sets up the site, the Git link, build settings and headers.
- Sets env vars with the Functions scope and Production-only secrets.
- Configures function paths, rate limits and background functions.
- Sets up Blobs stores. Watches deploys and function logs.
- Owns rollback when a deploy breaks.

### 12. Front-end engineer — `frontend-engineer` (added)

Builds the trivia screens, game state, scoring and results in TypeScript.

- Builds the topic picker, question view, feedback and results review.
- Implements shuffle, scoring, streaks and local score history.
- Turns Sable's tokens and Wren's flows into accessible HTML and CSS.
- Sets up Vite and the shared front-end tooling.

## 3. Why one extra role, and what was left out

Added:

- **Front-end engineer.** The required roles design the screens or build parts of them.
  None owns the game code itself: screens, state, scoring and results.
  Without this role, that work spreads across too many agents.

Considered and left out:

- **Accessibility specialist.** The UX designer, UI designer, front-end engineer and QA engineer share this skill (section 4).
- **DevOps or backend engineer.** There are no servers. The Netlify engineer covers deploys.
- **Data or database engineer.** Data is Open Trivia DB plus Netlify Blobs. No database to run.
- **Technical writer.** The architect and orchestrator keep the docs.
- **Native iOS or Android developer.** Not needed unless the app moves to a store build.
  The PWA expert flags that moment.
- **Content editor.** Questions come from Open Trivia DB. The app does not write its own.

## 4. Skills and who shares them

Each skill lists every agent that needs it. **Lead** marks the owner.
Each skill is a project skill at `.claude/skills/<skill folder>/SKILL.md`.
Each agent preloads its skills through the `skills:` field in its agent file.

Agent short names used below:
ORC orchestrator · META meta-agent · ARCH software-architect · API opentdb-integration-expert ·
PWA mobile-pwa-expert · SEC security-expert · ACE agent-console-engineer · SABLE ui-designer ·
WREN ux-designer · QA qa-engineer · NET netlify-engineer · FE frontend-engineer

### Team and process

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| Planning, task breakdown and routing | `team-planning-and-routing` | ORC, ARCH | ORC |
| Decision records and docs upkeep | `decision-records-and-docs` | ORC, ARCH, META | ARCH |
| Code review | `code-review-standards` | ARCH, SEC, QA, ACE, FE | ARCH |
| Writing agent files (`.claude/agents` format, prompts, model choice) | `agent-authoring` | META, ORC, ACE | META |
| Evaluating and improving agents | `agent-evaluation` | META, ORC, QA | META |

### Architecture and code

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| System design: static site plus Functions | `static-plus-functions-architecture` | ARCH, NET, ACE, SEC | ARCH |
| TypeScript | `typescript-standards` | FE, API, PWA, ACE, NET, QA | FE |
| Vite build and project tooling | `vite-tooling` | FE, PWA, NET | FE |
| HTML and CSS for mobile screens | `mobile-html-css` | FE, SABLE, PWA | FE |
| Game logic: state, shuffle, scoring | `trivia-game-logic` | FE, API, QA | FE |

### Open Trivia DB

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| Open Trivia DB API: categories, 50 questions, tokens, response codes | `opentdb-api` | API, FE, QA | API |
| Rate limits, retries and backoff | `rate-limits-and-retries` | API, ACE, NET, SEC | API |
| Safe text decoding and rendering | `safe-text-rendering` | API, FE, SEC | API |

### PWA and mobile

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| Web app manifest and installability | `web-app-manifest` | PWA, WREN, NET | PWA |
| Service workers and caching | `service-worker-caching` | PWA, NET, QA | PWA |
| iOS and Android platform behaviour | `ios-android-platform-behaviour` | PWA, WREN, SABLE, QA | PWA |
| Offline states and storage | `offline-and-storage` | PWA, FE, WREN | PWA |

### Design

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| Apple Human Interface Guidelines and UX flows | `apple-hig-ux` | WREN, SABLE, FE | WREN |
| Liquid Glass visual style, design tokens, icons | `liquid-glass-visual-design` | SABLE, FE | SABLE |
| Plain-language interface text | `plain-language-ui-text` | WREN, ORC | WREN |
| Accessibility (WCAG 2.2 AA) | `accessibility-wcag22` | WREN, SABLE, FE, QA, ACE | WREN |

### Agent Console, Claude and GitHub

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| Claude API: Messages, models, tool use, streaming | `claude-api-messages` | ACE, META, ARCH, SEC | ACE |
| GitHub REST API: contents, Git data, fine-grained tokens | `github-commits-api` | ACE, SEC, NET | ACE |
| Propose-and-approve flow and diff view | `propose-approve-flow` | ACE, SEC, WREN, QA | ACE |
| Long jobs: background functions, polling, idempotency | `long-agent-jobs` | ACE, NET, ARCH | ACE |

### Netlify

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| Netlify Functions: API, config, limits | `netlify-functions` | NET, ACE, ARCH, SEC | NET |
| Netlify Blobs | `netlify-blobs` | NET, ACE | NET |
| Env vars, deploy contexts and secrets handling | `netlify-env-and-secrets` | NET, SEC, ACE | NET |
| Headers, CSP and rate-limit rules | `netlify-headers-csp-rate-limits` | NET, SEC, PWA | NET |
| Deploys, previews and rollback | `netlify-deploys-and-rollback` | NET, QA, ORC | NET |

### Security

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| Threat modelling | `threat-modelling` | SEC, ARCH, ACE | SEC |
| Auth: password gate, sessions, CSRF | `console-auth-sessions-csrf` | SEC, ACE, QA | SEC |
| Path allow-list and deny-list | `path-allowlist-rules` | SEC, ACE, META, QA | SEC |
| Prompt-injection defence | `prompt-injection-defence` | SEC, ACE, META | SEC |
| Keeping secrets out of the browser | `secrets-out-of-browser` | SEC, NET, ACE, FE | SEC |

### Testing

| Skill | Skill folder | Agents | Lead |
| --- | --- | --- | --- |
| Unit and function tests (Vitest, fakes for Claude, GitHub, Blobs) | `unit-and-function-testing` | QA, FE, API, ACE | QA |
| End-to-end tests (Playwright on phone presets) | `e2e-playwright-testing` | QA, FE, PWA | QA |
| Automated and manual accessibility checks | `accessibility-testing` | QA, WREN, FE | QA |
| Security tests | `security-testing` | QA, SEC | QA |

## 5. Skill count per agent

| Agent | Skills | Leads |
| --- | --- | --- |
| orchestrator | 6 | 1 |
| meta-agent | 6 | 2 |
| software-architect | 8 | 3 |
| opentdb-integration-expert | 6 | 3 |
| mobile-pwa-expert | 9 | 4 |
| security-expert | 16 | 5 |
| agent-console-engineer | 19 | 4 |
| ui-designer-apple-liquid-glass (Sable) | 5 | 1 |
| ux-designer-apple-hig (Wren) | 8 | 3 |
| qa-engineer | 16 | 4 |
| netlify-engineer | 14 | 5 |
| frontend-engineer | 15 | 4 |

There are 39 skills. Each has one lead and at least one backup.
The agent-console engineer carries the most skills. Its work touches every layer.
Security and QA review that work closely to spread the load.

## 6. Who reviews what

| Change touches | Must review |
| --- | --- |
| `src/` trivia code | frontend-engineer, qa-engineer |
| `src/api/opentdb.ts` | opentdb-integration-expert |
| `public/manifest.webmanifest`, `public/sw.js` | mobile-pwa-expert, netlify-engineer |
| `netlify/functions/**` | security-expert, agent-console-engineer |
| `netlify.toml` | netlify-engineer, security-expert |
| `.claude/agents/**` | meta-agent, orchestrator |
| Visual design | Sable, Wren |
| Flows and interface text | Wren |
| Architecture or new dependency | software-architect, security-expert |

A human still approves every commit made from the Agent Console.
