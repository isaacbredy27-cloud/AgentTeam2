// Fake Claude client: scripted streaming replies, including a propose_change tool call.
// It records every request so tests can check model, system prompt and tools.
type Block = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown };

export type Script = (params: any) => { blocks: Block[]; stop_reason: string } | { error: { status: number } };

function lastUserText(params: any): string {
  const last = params.messages[params.messages.length - 1];
  if (typeof last.content === "string") return last.content;
  return last.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join(" ");
}

let toolN = 0;
export const defaultScript: Script = (params) => {
  const text = lastUserText(params).toLowerCase();
  const system = params.system?.[0]?.text ?? "";
  const who = /You are (\w+)/.exec(system)?.[1] ?? "an agent";
  if (text.includes("fail")) return { error: { status: 529 } };
  if (text.includes("bad path")) {
    return {
      stop_reason: "tool_use",
      blocks: [
        { type: "text", text: "I will try to change the Netlify config." },
        { type: "tool_use", id: `toolu_fake_${++toolN}`, name: "propose_change", input: { summary: "Edit config", files: [{ path: "netlify.toml", action: "update", content: "x" }] } },
      ],
    };
  }
  if (text.includes("propose")) {
    const n = ++toolN;
    return {
      stop_reason: "tool_use",
      blocks: [
        { type: "text", text: "Here is a small change for you to review." },
        {
          type: "tool_use", id: `toolu_fake_${n}`, name: "propose_change",
          input: {
            summary: "Add a console demo note",
            files: [
              { path: `docs/console-demo-${n}.md`, action: "create", content: "# Console demo\n\nThis file was proposed in the Agent Console.\n" },
              { path: "docs/plans/README.md", action: "update", content: "# Build plans (wave 1)\n\nUpdated from the console.\n" },
            ],
          },
        },
      ],
    };
  }
  return { stop_reason: "end_turn", blocks: [{ type: "text", text: `Hello, I'm ${who}. I run on ${params.model}. You said: ${lastUserText(params)}` }] };
};

export function fakeAnthropic(script: Script = defaultScript) {
  const calls: any[] = [];
  return {
    calls,
    messages: {
      stream(params: any) {
        calls.push(params);
        const out = script(params);
        const events: any[] = [];
        let final: any = null;
        if ("blocks" in out) {
          events.push({ type: "message_start", message: { content: [] } });
          out.blocks.forEach((b, index) => {
            events.push({ type: "content_block_start", index, content_block: b.type === "text" ? { type: "text", text: "" } : { ...b, input: {} } });
            if (b.type === "text") {
              for (const piece of b.text.match(/.{1,12}/gs) ?? []) events.push({ type: "content_block_delta", index, delta: { type: "text_delta", text: piece } });
            } else {
              events.push({ type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(b.input) } });
            }
            events.push({ type: "content_block_stop", index });
          });
          events.push({ type: "message_delta", delta: { stop_reason: out.stop_reason } }, { type: "message_stop" });
          final = { role: "assistant", content: out.blocks, stop_reason: out.stop_reason, model: params.model };
        }
        return {
          async *[Symbol.asyncIterator]() {
            if ("error" in out) throw Object.assign(new Error("fake API error"), { status: out.error.status });
            for (const e of events) yield e;
          },
          async finalMessage() {
            if ("error" in out) throw Object.assign(new Error("fake API error"), { status: out.error.status });
            return final;
          },
        };
      },
    },
  };
}
