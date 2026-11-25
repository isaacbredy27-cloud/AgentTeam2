# Claude Code skills

Source: https://code.claude.com/docs/en/skills (read 2026-11-25)

- Project skills: `.claude/skills/<skill-name>/SKILL.md`. Commit them to share with the team.
- Frontmatter between `---` markers on line 1, then Markdown instructions. All fields optional; `description` recommended.
- Field names are lowercase with hyphens (except `when_to_use`). Unknown fields are ignored silently.
- `name` defaults to the folder name and becomes `/name`. Avoid clashes with built-ins: a project skill named
  like a bundled one (e.g. `code-review`) collides — we renamed ours `code-review-standards`.
- `description` + `when_to_use` are cut at 1,536 characters in the listing. Put the key use case first.
- `disable-model-invocation: true`: only people can run it; also blocks preloading into subagents.
- `user-invocable: false`: only Claude can run it; hidden from the `/` menu.
- `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork` + `agent`, `paths`, `hooks` also exist.
- "Keep `SKILL.md` under 500 lines." Move detail into supporting files and link them from `SKILL.md`.
- Once loaded, skill text stays in context across turns: "every line is a recurring token cost".
- Reserved folder names: `synced`, `anthropic-skills`.
