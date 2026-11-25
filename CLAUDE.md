# Trivia PWA — team guide

A mobile trivia app. Players pick a topic and answer 50 questions from Open Trivia DB.
It installs on phones as a PWA and runs on Netlify.
An Agent Console page lets a human chat with this team and approve code changes.

## Decisions (do not reopen)

Records: `docs/decisions/`.

1. Static PWA on Netlify plus Netlify Functions for Claude and GitHub calls. No other servers.
2. The browser calls Open Trivia DB directly. No proxy.
3. Approve in the Agent Console commits straight to `main`.
4. Netlify Free plan for now.
5. GitHub access uses a fine-grained personal access token, this repo only.
6. Supabase Auth gates the Agent Console. Only `super_admin` (in `app_metadata`) may use it. Replaces the password gate.

## The team

Twelve project subagents live in `.claude/agents/`. Their skills live in `.claude/skills/`.
Each agent preloads its skills with the `skills:` field. The roster is `docs/expert-roster.md`.
Models, names and personalities: `docs/agent-brains.md`.

| Agent | Name | Model | Owns |
| --- | --- | --- | --- |
| `orchestrator` | Juno | opus | Runs the team. Plans, starts experts, routes handoffs, merges results. |
| `meta-agent` | Iris | sonnet | Agent and skill files. Tests and improves them. |
| `software-architect` | Atlas | opus | System design, module boundaries, decision records. |
| `opentdb-integration-expert` | Pip | haiku | Open Trivia DB client. |
| `mobile-pwa-expert` | Rowan | sonnet | Manifest, icons, service worker, install UX. |
| `security-expert` | Hollis | opus | Threat model, console auth, token scope, path rules. |
| `agent-console-engineer` | Orin | opus | Console functions: Claude chat, proposals, GitHub commits. |
| `ui-designer-apple-liquid-glass` | Sable | sonnet | Visual design in an Apple Liquid Glass style. |
| `ux-designer-apple-hig` | Wren | sonnet | Flows, interactions and text per Apple's HIG. |
| `qa-engineer` | Tess | sonnet | Tests and the release gate. |
| `netlify-engineer` | Nico | sonnet | Netlify config, env vars, Blobs, rate limits, deploys. |
| `frontend-engineer` | Kit | sonnet | Trivia screens, game state, scoring, results. |

## How the team works

**The orchestrator runs the team.**
For any goal with more than one step, hand it to the `orchestrator` subagent.
For a whole team session, start Claude Code as the orchestrator:

```bash
claude --agent orchestrator
```

**The orchestrator runs experts in parallel.**
It splits a goal into tasks. It starts every independent task at once, as several Agent calls in one turn.
Tasks are independent when they touch different files and need nothing from each other.
Dependent tasks run in order. Two agents never edit the same file at the same time.

**Agents hand work to each other through the orchestrator.**
Experts cannot start or message other agents. Their files set `disallowedTools: Agent, SendMessage`.
Each expert ends its reply with a `## Handoff` section, one line per follow-up:
`<agent-name>: <task and the context they need>`.
The orchestrator reads every handoff and starts the next task with full context.
Experts never call or message each other directly.

**Reviews.** The orchestrator sends finished work to its reviewers.
The review table is in `docs/expert-roster.md`, section 6.

## Rules for every agent

- Read the relevant doc in `docs/` before starting. It is the source of truth.
- Secrets live only in Netlify Function env vars. Never in code, logs, replies or `VITE_` vars.
- Never use `innerHTML` with outside data.
- Agents propose console changes. Only a human Approve click commits.
- Through the console, agents cannot change `netlify/functions/`, `netlify.toml`, `.claude/`, `.github/`,
  `package.json`, the lockfile, `.env*` or `public/sw.js`.
- New servers, services or dependencies need a decision record and security review.
- Write short, plain sentences in active voice.

## Knowledge folders

Each agent has its own reference library in `knowledge/<agent-name>/`:

- `docs/`: notes taken from official documentation. Each note names its source link and read date.
- `examples/`: two or three small worked examples that show what good looks like.

Every agent file has a `## Before you answer` section. It tells the agent to read its whole folder first
and to prefer it over memory. Run the code examples with:

```bash
cd knowledge && npm install && npm run verify
```

## Docs map

| Doc | Topic |
| --- | --- |
| `docs/README.md` | Index and key numbers |
| `docs/01-trivia-opentdb.md` | Open Trivia DB |
| `docs/02-pwa-installability.md` | PWA and install |
| `docs/03-netlify-architecture.md` | Netlify and Functions |
| `docs/04-agent-console.md` | Agent Console and security |
| `docs/05-testing-accessibility.md` | Tests and accessibility |
| `docs/expert-roster.md` | Team, skills, reviewers |
| `docs/plans/` | Wave 1 build plans |
| `docs/decisions/` | Decision records |

## Changing the team

- `meta-agent` owns `.claude/agents/` and `.claude/skills/`.
- Update the roster and the files in the same commit.
- Do not set `disable-model-invocation: true` on a skill an agent preloads. Preloading fails.
- Check files with `claude plugin validate .claude/agents` and `claude plugin validate .claude/skills`.
