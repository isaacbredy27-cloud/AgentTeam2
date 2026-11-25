# Claude Messages API and streaming

Sources (read 2026-11-25):
- https://platform.claude.com/docs/en/api/messages/create
- https://platform.claude.com/docs/en/build-with-claude/streaming

## Request
`POST /v1/messages` with `model`, `max_tokens`, `messages`, optional `system`, `tools`, `tool_choice`, `output_config`.
The TypeScript SDK is `@anthropic-ai/sdk`. `new Anthropic()` reads `ANTHROPIC_API_KEY`.

## Stop reasons
`end_turn` (natural end), `max_tokens`, `tool_use`, `refusal`, `pause_turn`, `stop_sequence`. Check it before reading content.

## Streaming event order (quoted from the docs)
1. `message_start`: "contains a `Message` object with empty `content`".
2. For each content block: `content_block_start`, any number of `content_block_delta`, then `content_block_stop`.
   "Each content block has an `index` that corresponds to its index in the final Message `content` array."
3. One or more `message_delta` events (top-level changes such as `stop_reason`, cumulative `usage`).
4. A final `message_stop`.
- Streams "might also include any number of `ping` events".
- `event: error` can arrive mid-stream, e.g. `overloaded_error` (HTTP 529 equivalent).
  "If you use the SDK, your code doesn’t receive this event. The SDK ends the stream, and the code that reads the stream gets an error instead."

## Delta types
- `text_delta`: `{"type": "text_delta", "text": "ello frien"}`
- `input_json_delta`: `{"type": "input_json_delta", "partial_json": "{\"location\": \"San Fra"}`
  "By default, the API buffers each key and value in `input` until it is complete."
- `thinking_delta` and `signature_delta` for thinking blocks.

## SDK pattern
```ts
const stream = client.messages.stream({ model, max_tokens, system, tools, messages });
for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") send(event.delta.text);
}
const final = await stream.finalMessage(); // full Message with tool_use blocks parsed
```
