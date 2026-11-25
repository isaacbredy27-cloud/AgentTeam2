// Calls to the console functions. Every call carries the Supabase access token.
export type AgentInfo = {
  name: string; firstName: string; description: string; model: string; modelId: string;
  personality: string; knowledgeFiles: string[];
};
export type ProposalFile = { path: string; action: "create" | "update" | "delete"; diff: string };
export type Proposal = {
  id: string; agent: string; summary: string; status: string; files: ProposalFile[];
  commitSha?: string; commitUrl?: string; staleFiles?: string[];
};
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; data?: any };

export async function api<T>(token: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    return { ok: false, status: 0, error: "No connection. Check your network and try again." };
  }
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, data: data as T };
  const fallback = res.status === 429 ? "Too many requests. Wait a minute and try again." : "Something went wrong. Try again.";
  return { ok: false, status: res.status, error: typeof data?.error === "string" ? data.error : fallback, data };
}

export type ChatEvents = {
  onText: (t: string) => void;
  onDone: (d: { stopReason: string; assistantContent: unknown[]; toolResult: unknown; proposal: Proposal | null }) => void;
  onError: (message: string) => void;
};

/** POST /api/chat and read the Server-Sent Events stream. */
export async function chat(token: string, body: unknown, ev: ChatEvents, signal: AbortSignal): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    ev.onError("No connection. Check your network and try again.");
    return;
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    ev.onError(typeof data?.error === "string" ? data.error : res.status === 429 ? "Too many messages. Wait a minute and try again." : "The reply failed. Try again.");
    return;
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  let finished = false;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let cut: number;
      while ((cut = buf.indexOf("\n\n")) >= 0) {
        const chunk = buf.slice(0, cut);
        buf = buf.slice(cut + 2);
        const event = /^event: (.*)$/m.exec(chunk)?.[1];
        const dataLine = /^data: (.*)$/m.exec(chunk)?.[1];
        if (!event || dataLine === undefined) continue;
        const data = JSON.parse(dataLine);
        if (event === "text") ev.onText(data.text);
        else if (event === "done") { finished = true; ev.onDone(data); }
        else if (event === "error") { finished = true; ev.onError(data.message); }
      }
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    ev.onError("The connection dropped. Try again.");
    return;
  }
  if (!finished) ev.onError("The reply stopped early. Try again.");
}
