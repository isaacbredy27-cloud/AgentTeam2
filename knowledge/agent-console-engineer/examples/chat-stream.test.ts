// Runs the real SDK against a fake fetch that replays a documented SSE stream. No API key or network needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { chatTurn } from "./chat-stream.ts";

const sse = (events: object[]) =>
  events.map((e: any) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");

const input = { summary: "Fix typo on topic screen", files: [{ path: "src/ui/topic.ts", action: "update", content: "export {};\n" }] };
const json = JSON.stringify(input);

const BODY = sse([
  { type: "message_start", message: { id: "msg_1", type: "message", role: "assistant", content: [], model: "claude-sonnet-5-5", stop_reason: null, stop_sequence: null, usage: { input_tokens: 25, output_tokens: 1 } } },
  { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
  { type: "ping" },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "I will fix " } },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "the typo." } },
  { type: "content_block_stop", index: 0 },
  { type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "toolu_1", name: "propose_change", input: {} } },
  { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: json.slice(0, 30) } },
  { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: json.slice(30) } },
  { type: "content_block_stop", index: 1 },
  { type: "message_delta", delta: { stop_reason: "tool_use", stop_sequence: null }, usage: { output_tokens: 60 } },
  { type: "message_stop" },
]);

test("streams text and parses the propose_change tool call", async () => {
  let sentBody: any;
  const fakeFetch = async (_url: any, init: any) => {
    sentBody = JSON.parse(init.body);
    return new Response(BODY, { status: 200, headers: { "content-type": "text/event-stream" } });
  };
  const client = new Anthropic({ apiKey: "test-key", fetch: fakeFetch as any, maxRetries: 0 });

  let text = "";
  const { final, proposal } = await chatTurn(client, { model: "sonnet", systemPrompt: "You are Wren." },
    [{ role: "user", content: "Fix the typo" }], (t) => (text += t));

  assert.equal(sentBody.model, "claude-sonnet-5-5");
  assert.equal(sentBody.stream, true);
  assert.equal(sentBody.tools[0].strict, true);
  assert.deepEqual(sentBody.tool_choice, { type: "auto", disable_parallel_tool_use: true });
  assert.equal(text, "I will fix the typo.");
  assert.equal(final.stop_reason, "tool_use");
  assert.ok(proposal && proposal.type === "tool_use");
  assert.deepEqual(proposal.input, input);
});
