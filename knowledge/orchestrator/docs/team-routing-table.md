# Team routing table

Source: this repo, `docs/expert-roster.md` sections 2 and 6, and `CLAUDE.md` (read 2026-11-25)

| Work | Owner | Reviewers |
| --- | --- | --- |
| Trivia screens, game state, scoring (`src/quiz`, `src/ui`) | frontend-engineer | qa-engineer |
| Open Trivia DB client (`src/api/opentdb.ts`) | opentdb-integration-expert | frontend-engineer, qa-engineer |
| Manifest, icons, `sw.js`, install UX | mobile-pwa-expert | netlify-engineer |
| `netlify/functions/**` | agent-console-engineer | security-expert |
| `netlify.toml`, env vars, deploys | netlify-engineer | security-expert |
| Visual design, tokens, icons | ui-designer-apple-liquid-glass (Sable) | ux-designer-apple-hig (Wren) |
| Flows, interaction, interface text | ux-designer-apple-hig (Wren) | Sable |
| Architecture, new dependency, decision records | software-architect | security-expert |
| `.claude/agents/**`, `.claude/skills/**`, `knowledge/**` | meta-agent | orchestrator |
| Tests, release gate | qa-engineer | author of the change |

Escalate to the human: new services or dependencies, scope changes, expert disagreement, anything touching secrets.
Never approve a console proposal yourself.
