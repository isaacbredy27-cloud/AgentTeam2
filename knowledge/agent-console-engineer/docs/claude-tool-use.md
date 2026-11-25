# Claude tool use

Source: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview (read 2026-11-25)

- Client tools run in your application. Claude returns a `tool_use` block; your code runs it and replies with
  a `tool_result` block that carries the matching `tool_use_id`.
- Default `tool_choice` is `{"type": "auto"}`: "Claude determines on each turn whether to call a tool or respond directly."
- `disable_parallel_tool_use: true` with `auto` allows at most one tool call per turn.
- "Add `strict: true` to your custom tool definitions to ensure Claude’s tool calls always match your schema exactly."
- Return a failed tool as `tool_result` with `is_error: true`. Never drop it.
- Return all `tool_result` blocks for one assistant turn in a single user message.

## Round trip (from the docs' TypeScript sample)
```ts
messages.push({ role: "assistant", content: response.content });
messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: result }] });
```

## Our tool
One tool only: `propose_change` (see `examples/chat-stream.ts`). It never writes to GitHub.
