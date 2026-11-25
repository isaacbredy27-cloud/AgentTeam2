---
name: agent-authoring
description: "How to write and edit .claude/agents files and .claude/skills SKILL.md files for this team. Use when creating or changing an agent or skill."
---

# Writing agent files

## Subagent file (`.claude/agents/<name>.md`)
- YAML frontmatter first line `---`. Required: `name`, `description`.
- Use: `model` (`opus`, `sonnet`, `haiku`, `inherit` or a full ID), `skills` (list), `disallowedTools`.
- Field names are camelCase and must match exactly. Unknown fields are ignored silently.
- `name` must be unique, no `:`, not starting with `-`.
- Body is the system prompt. The agent does not get the Claude Code system prompt.
- Experts set `disallowedTools: Agent, SendMessage`. Only the orchestrator spawns or messages agents.

## Skill file (`.claude/skills/<name>/SKILL.md`)
- Frontmatter: `name` (same as folder), `description` with the key use case first.
- Do not set `disable-model-invocation: true` on a skill an agent preloads. Preloading would fail.
- Keep the body short and imperative. Under 500 lines. Move detail to supporting files.

## Wiring
- `skills:` in the agent lists skills to preload in full at startup. Max 32 names.
- The roster `docs/expert-roster.md` is the source of truth for who has which skill.
- Change the roster and the files in one commit.

## Console constraints
- The Agent Console parses `name`, `model` and `description`, and uses the body as personality.
- Keep descriptions to one or two sentences.
- `.claude/**` is on the console deny-list. Agents cannot change agent files from the console.

## Knowledge folders
- Every agent has `knowledge/<name>/docs/` (notes from official docs, each with a source link) and `knowledge/<name>/examples/` (2–3 worked examples).
- Every agent file has a `## Before you answer` section pointing at its folder.
- Run `npm run verify` in `knowledge/` after changing any example.

---
Shared by: meta-agent, orchestrator, agent-console-engineer. Lead: meta-agent.
