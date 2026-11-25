# Claude Code subagent files

Source: https://code.claude.com/docs/en/sub-agents (read 2026-11-25)

- Project subagents live in `.claude/agents/`. Check them into version control. Claude Code watches the folder; edits apply on the next delegation without a restart.
- YAML frontmatter, then the system prompt in Markdown. "Only `name` and `description` are required."
- Field names are camelCase and must match exactly: "Claude Code ignores a field it doesn’t recognize without reporting an error."
- Fields: `name`, `description`, `tools`, `disallowedTools`, `model` (`sonnet`, `opus`, `haiku`, `fable`, full ID, or `inherit`),
  `permissionMode`, `maxTurns`, `autoCompactWindow`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `omitClaudeMd`,
  `effort`, `isolation`, `color`, `initialPrompt`, `experimental`.
- `name`: unique, at most 256 characters, no `:`, must not start with `-`.
- Files skipped: no `name`; opening `---` not on line 1; bad `name`; `name` without `description`; YAML that does not parse.
- Check a folder: `claude plugin validate .claude/agents`.
- `skills`: preloads full skill content at startup, up to the first 32 names. It does not limit which skills the agent can call.
  "You can’t preload skills that set `disable-model-invocation: true`."
- `disallowedTools: Agent` stops an expert spawning subagents. Removing `SendMessage` stops it messaging siblings.
- Keep descriptions brief: a startup warning appears when all descriptions together pass 15,000 tokens.
- Add "use proactively" to a description to encourage automatic delegation.
