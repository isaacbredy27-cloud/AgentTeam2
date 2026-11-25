// Stream one console chat turn with the official SDK and capture a propose_change call.
import Anthropic from "@anthropic-ai/sdk";

export const PROPOSE_CHANGE_TOOL = {
  name: "propose_change",
  description:
    "Propose file changes for human review. Nothing is written until a human approves. Use full file contents.",
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["summary", "files"],
    properties: {
      summary: { type: "string" },
      files: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["path", "action", "content"],
          properties: {
            path: { type: "string" },
            action: { type: "string", enum: ["create", "update", "delete"] },
            content: { type: "string" },
          },
        },
      },
    },
  },
};

export const MODEL_IDS: Record<string, string> = {
  opus: "claude-opus-5-5", inherit: "claude-opus-5-5", sonnet: "claude-sonnet-5-5", haiku: "claude-haiku-5-5",
};

export async function chatTurn(
  client: Anthropic,
  agent: { model?: string; systemPrompt: string },
  messages: Anthropic.MessageParam[],
  onText: (t: string) => void,
) {
  const stream = client.messages.stream({
    model: MODEL_IDS[agent.model ?? "inherit"] ?? "claude-opus-5-5",
    max_tokens: 8000,
    system: agent.systemPrompt,
    tools: [PROPOSE_CHANGE_TOOL],
    tool_choice: { type: "auto", disable_parallel_tool_use: true },
    messages,
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") onText(event.delta.text);
  }
  const final = await stream.finalMessage();
  const proposal = final.content.find((b) => b.type === "tool_use" && b.name === "propose_change");
  return { final, proposal };
}
