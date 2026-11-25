---
name: claude-api-messages
description: "How the console calls the Claude Messages API with the TypeScript SDK: models, streaming, tools and errors. Use when writing or reviewing Claude API code."
---

# Claude API in the console

## SDK
- `@anthropic-ai/sdk`. `new Anthropic()` reads `ANTHROPIC_API_KEY` from the function env.
- Calls happen only in Netlify Functions. Never in the browser.

## Models
| Agent `model` | API ID | Price in/out per MTok |
| --- | --- | --- |
| `opus`, `inherit`, missing | `claude-opus-5-5` | $4 / $20 |
| `sonnet` | `claude-sonnet-5-5` | $2 / $10 |
| `haiku` | `claude-haiku-5-5` | $0.10 / $0.50 |
Full IDs pass only if on the allow-list. Never add date suffixes.

## Request rules
- Stream with `client.messages.stream(...)`. Use `finalMessage()` for the end result.
- Opus 5.5: thinking cannot be disabled. Control depth with `output_config: { effort }`. Default effort is `medium`.
- Opus 5.5 and Sonnet 5.5 reject forced `tool_choice` (`any`, `tool`). Use `auto` and `strict: true`.
- No assistant prefill. It returns 400.
- Add refusal fallbacks: beta `server-side-fallback-2026-07-01`, `fallbacks: "default"`.
- With streaming client tools, set `eager_input_streaming: true`. Validate parsed input against the schema.
- Always set `max_tokens`.

## Responses
- Check `stop_reason` first: `end_turn`, `tool_use`, `max_tokens`, `refusal`.
- Pass `response.content` back unchanged on the next turn.
- Answer every `tool_use` with a `tool_result` in the next user message.
- Parse tool input as JSON. Never string-match it.

## Errors
- Use SDK error classes, most specific first: `RateLimitError`, `APIStatusError`, `APIConnectionError`.

Details: `docs/04-agent-console.md`, section 3.

---
Shared by: agent-console-engineer, meta-agent, software-architect, security-expert. Lead: agent-console-engineer.
