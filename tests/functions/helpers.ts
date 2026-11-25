// Build function deps from fakes. No network, no keys.
import { resolve } from "node:path";
import { memoryStore } from "../../netlify/lib/store.ts";
import type { Deps } from "../../netlify/lib/deps.ts";
import { fakeAnthropic, type Script } from "../fakes/anthropic.ts";
import { fakeGitHub } from "../fakes/github.ts";
import { fakeSupabase, tokenFor } from "../fakes/supabase.ts";

export const ROOT = resolve(import.meta.dirname, "../..");
export const SITE = "https://trivia.example";
const ANON = "anon-key-test";

export function setup(opts: { script?: Script; env?: Record<string, string | undefined> } = {}) {
  const supabase = fakeSupabase({ anonKey: ANON });
  const github = fakeGitHub({ root: ROOT, owner: "owner", repo: "repo" });
  const anthropic = fakeAnthropic(opts.script);
  const proposals = memoryStore();
  const audit = memoryStore();
  let supabaseDown = false;
  const env: Record<string, string | undefined> = {
    SUPABASE_URL: "https://proj.supabase.co", SUPABASE_ANON_KEY: ANON,
    ANTHROPIC_API_KEY: "sk-ant-test-secret-value", GITHUB_TOKEN: "github_pat_TESTSECRETVALUE1234567890",
    GITHUB_OWNER: "owner", GITHUB_REPO: "repo", GITHUB_BRANCH: "main", ...opts.env,
  };
  const fetchFake = (async (input: any, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith("https://api.github.com/")) return github.handle(url, init);
    if (url.startsWith("https://proj.supabase.co/")) {
      if (supabaseDown) throw new TypeError("fetch failed");
      return supabase.handle(new Request(url, init), new URL(url).pathname);
    }
    throw new Error("unexpected fetch " + url);
  }) as typeof fetch;
  const deps: Deps = {
    fetch: fetchFake, env: (n) => env[n], root: ROOT,
    proposals: async () => proposals, audit: async () => audit,
    anthropic: async () => anthropic, now: () => new Date("2026-11-25T12:00:00Z"),
  };
  return { deps, github, anthropic, proposals, audit, supabase, env, setSupabaseDown: (v: boolean) => { supabaseDown = v; } };
}

export const ADMIN = tokenFor("admin@example.test");
export const PLAYER = tokenFor("player@example.test");
export const SNEAKY = tokenFor("sneaky@example.test");

export function req(path: string, init: { method?: string; token?: string; body?: unknown; origin?: string | null; contentType?: string } = {}) {
  const headers: Record<string, string> = {};
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  if (init.body !== undefined) headers["Content-Type"] = init.contentType ?? "application/json";
  if (init.origin !== null && init.method === "POST") headers.Origin = init.origin ?? SITE;
  return new Request(SITE + path, {
    method: init.method ?? "GET", headers,
    body: init.body === undefined ? undefined : typeof init.body === "string" ? init.body : JSON.stringify(init.body),
  });
}

export async function readSse(res: Response): Promise<{ event: string; data: any }[]> {
  const text = await res.text();
  return text.split("\n\n").filter(Boolean).map((chunk) => ({
    event: /^event: (.*)$/m.exec(chunk)![1],
    data: JSON.parse(/^data: (.*)$/m.exec(chunk)![1]),
  }));
}

/** Assert a response body leaks no secret values. */
export function assertNoSecrets(text: string, env: Record<string, string | undefined>) {
  for (const k of ["ANTHROPIC_API_KEY", "GITHUB_TOKEN"]) {
    const v = env[k];
    if (v && text.includes(v)) throw new Error(`response leaked ${k}`);
  }
}
