# Claude models

Source: https://platform.claude.com/docs/en/about-claude/models/overview (read 2026-11-25)

| | Claude Opus 5.5 | Claude Sonnet 5.5 | Claude Haiku 5.5 |
| --- | --- | --- | --- |
| API ID | `claude-opus-5-5` | `claude-sonnet-5-5` | `claude-haiku-5-5` |
| Use | Long-running agentic coding and knowledge work | Best mix of speed and intelligence | High-volume, latency-sensitive tasks |
| Price (input / output per MTok) | $4 / $20 | $2 / $10 | from $0.10 / from $0.50 |
| Thinking | Adaptive, always on | Adaptive | Adaptive |
| Default effort | `medium` | `high` | `medium` |
| Context window | 1M tokens | 1M tokens | 1M tokens |
| Max output | 128K tokens | 128K tokens | 128K tokens |
| Retirement | not before 2027-09-22 | not before 2027-09-28 | not before 2027-10-07 |

## Console mapping
Agent file `model` → API ID: `opus`, `inherit` or missing → `claude-opus-5-5`; `sonnet` → `claude-sonnet-5-5`;
`haiku` → `claude-haiku-5-5`. Use IDs exactly. Never add date suffixes.

## Request rules that bite (from the Claude API reference)
- Opus 5.5: thinking cannot be turned off. `thinking: {type: "disabled"}` returns 400. Use `output_config: { effort }`.
- Opus 5.5 and Sonnet 5.5: forced `tool_choice` (`any` or `tool`) returns 400. Use `auto` plus `strict: true`.
- No assistant prefill on current models. It returns 400.
