// Real dependencies for production. Tests and the harness pass their own.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { JsonStore } from "./store.ts";

export type StreamLike = AsyncIterable<any> & { finalMessage(): Promise<any> };
export type AnthropicLike = { messages: { stream(params: any, opts?: any): StreamLike } };

export type Deps = {
  fetch: typeof fetch;
  env: (name: string) => string | undefined;
  root: string;
  proposals: () => Promise<JsonStore>;
  audit: () => Promise<JsonStore>;
  anthropic: () => Promise<AnthropicLike>;
  now: () => Date;
};

export function realDeps(): Deps {
  const env = (n: string) => process.env[n];
  const store = (name: string) => async () => {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name, consistency: "strong" }) as unknown as JsonStore;
  };
  return {
    fetch: (...a) => fetch(...a),
    env,
    root: findRoot(),
    proposals: store("proposals"),
    audit: store("audit"),
    anthropic: async () => {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      return new Anthropic({ maxRetries: 1 }) as unknown as AnthropicLike; // reads ANTHROPIC_API_KEY
    },
    now: () => new Date(),
  };
}

export const authConfig = (d: Deps) => ({
  fetch: d.fetch, supabaseUrl: d.env("SUPABASE_URL"), supabaseAnonKey: d.env("SUPABASE_ANON_KEY"),
});
export const gitHubConfig = (d: Deps) => ({
  fetch: d.fetch, token: d.env("GITHUB_TOKEN"), owner: d.env("GITHUB_OWNER"),
  repo: d.env("GITHUB_REPO"), branch: d.env("GITHUB_BRANCH") || "main",
});

export async function audit(d: Deps, event: string, data: Record<string, unknown>): Promise<void> {
  try {
    const at = d.now().toISOString();
    const key = `${at.slice(0, 10)}/${at}-${event}-${Math.random().toString(36).slice(2, 8)}`;
    await (await d.audit()).setJSON(key, { at, event, ...data });
  } catch {
    // Audit failure must not break the request. Never log the payload.
    console.error("audit write failed", event);
  }
}

export function newProposalId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return "P-" + Array.from(bytes, (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
}

/** The folder that holds .claude/agents. On Netlify, included_files keep their repo-relative paths. */
export function findRoot(): string {
  const here = (() => { try { return dirname(fileURLToPath(import.meta.url)); } catch { return process.cwd(); } })();
  const candidates = [
    process.env.APP_ROOT, process.cwd(), process.env.LAMBDA_TASK_ROOT,
    here, join(here, ".."), join(here, "../.."), join(here, "../../.."),
  ].filter((c): c is string => Boolean(c));
  return candidates.find((c) => existsSync(join(c, ".claude", "agents"))) ?? process.cwd();
}
