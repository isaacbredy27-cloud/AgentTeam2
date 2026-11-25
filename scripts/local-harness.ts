// Local harness: serves dist/ and runs the real function handlers with real Request objects.
// Claude, GitHub and Supabase are fakes, so no keys and no network are needed.
// Run: npm run build && npm run preview:local   (PORT defaults to 8888)
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { memoryStore } from "../netlify/lib/store.ts";
import type { Deps } from "../netlify/lib/deps.ts";
import { fakeAnthropic } from "../tests/fakes/anthropic.ts";
import { fakeGitHub } from "../tests/fakes/github.ts";
import { fakeSupabase } from "../tests/fakes/supabase.ts";
import * as configFn from "../netlify/functions/config.mts";
import * as meFn from "../netlify/functions/me.mts";
import * as agentsFn from "../netlify/functions/agents.mts";
import * as chatFn from "../netlify/functions/chat.mts";
import * as proposalFn from "../netlify/functions/proposal.mts";
import * as approveFn from "../netlify/functions/proposal-approve.mts";
import * as rejectFn from "../netlify/functions/proposal-reject.mts";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const port = Number(process.env.PORT ?? 8888);
const origin = `http://127.0.0.1:${port}`;
const ANON = "fake-anon-key-local";

const supabase = fakeSupabase({ anonKey: ANON });
const github = fakeGitHub({ root, owner: "isaacbredy27-cloud", repo: "AgentTeam2" });
const anthropic = fakeAnthropic();
const proposals = memoryStore();
const auditStore = memoryStore();
const env: Record<string, string> = {
  SUPABASE_URL: `${origin}/fake-supabase`, SUPABASE_ANON_KEY: ANON,
  ANTHROPIC_API_KEY: "fake-local-key", GITHUB_TOKEN: "fake-local-token",
  GITHUB_OWNER: "isaacbredy27-cloud", GITHUB_REPO: "AgentTeam2", GITHUB_BRANCH: "main",
};

const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("https://api.github.com/")) return github.handle(url, init);
  if (url.startsWith(`${origin}/fake-supabase/`)) {
    const req = new Request(url, init);
    return supabase.handle(req, new URL(url).pathname.replace("/fake-supabase", ""));
  }
  throw new Error(`harness blocked outbound fetch to ${new URL(url).host}`);
}) as typeof fetch;

const deps: Deps = {
  fetch: fakeFetch, env: (n) => env[n], root,
  proposals: async () => proposals, audit: async () => auditStore,
  anthropic: async () => anthropic, now: () => new Date(),
};

type Handler = (req: Request, ctx?: any) => Promise<Response>;
const routes: [RegExp, string, Handler][] = [
  [/^\/api\/config$/, "GET", configFn.makeHandler(deps)],
  [/^\/api\/me$/, "GET", meFn.makeHandler(deps)],
  [/^\/api\/agents$/, "GET", agentsFn.makeHandler(deps)],
  [/^\/api\/chat$/, "POST", chatFn.makeHandler(deps)],
  [/^\/api\/proposals\/(?<id>[^/]+)$/, "GET", proposalFn.makeHandler(deps)],
  [/^\/api\/proposals\/(?<id>[^/]+)\/approve$/, "POST", approveFn.makeHandler(deps)],
  [/^\/api\/proposals\/(?<id>[^/]+)\/reject$/, "POST", rejectFn.makeHandler(deps)],
];

// Static headers from netlify.toml's "/*" block, so the CSP is exercised locally too.
const toml = await readFile(join(root, "netlify.toml"), "utf8");
const csp = /Content-Security-Policy = "([^"]+)"/.exec(toml)?.[1] ?? "";
const STATIC_HEADERS = { "Content-Security-Policy": csp, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" };
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain",
};

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  const body = chunks.length && req.method !== "GET" && req.method !== "HEAD" ? Buffer.concat(chunks) : undefined;
  return new Request(origin + req.url, { method: req.method, headers, body });
}

async function send(res: ServerResponse, r: Response) {
  const headers: Record<string, string> = {};
  r.headers.forEach((v, k) => { headers[k] = v; });
  res.writeHead(r.status, headers);
  if (!r.body) return res.end();
  Readable.fromWeb(r.body as any).pipe(res);
}

async function serveStatic(pathname: string, res: ServerResponse) {
  let file = join(dist, pathname);
  if (!file.startsWith(dist)) return res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    if (!extname(file)) file = join(file, "index.html");
  }
  try {
    const body = await readFile(file);
    const extra = pathname === "/sw.js" ? { "Cache-Control": "no-cache" } : {};
    res.writeHead(200, { ...STATIC_HEADERS, ...extra, "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404, { ...STATIC_HEADERS, "Content-Type": "text/plain" }).end("Not found");
  }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", origin);
    if (url.pathname.startsWith("/fake-supabase/")) {
      return send(res, await supabase.handle(await toRequest(req), url.pathname.replace("/fake-supabase", "")));
    }
    if (url.pathname === "/__fake/github") {
      return send(res, Response.json({ commits: github.commitsMade(), refUpdates: github.refUpdates() }));
    }
    if (url.pathname === "/__fake/github/touch" && req.method === "POST") {
      const { path, content } = JSON.parse((await toRequest(req).then((r) => r.text())) || "{}");
      github.touch(path, content);
      return send(res, Response.json({ ok: true }));
    }
    if (url.pathname === "/__fake/anthropic") {
      return send(res, Response.json({ calls: anthropic.calls.map((c) => ({ model: c.model, systemChars: JSON.stringify(c.system).length, tools: c.tools.map((t: any) => t.name), messages: c.messages.length })) }));
    }
    if (url.pathname.startsWith("/api/")) {
      for (const [re, method, handler] of routes) {
        const m = re.exec(url.pathname);
        if (!m) continue;
        if (req.method !== method) return send(res, Response.json({ error: "Method not allowed" }, { status: 405 }));
        return send(res, await handler(await toRequest(req), { params: m.groups ?? {} }));
      }
      return send(res, Response.json({ error: "Not found" }, { status: 404 }));
    }
    return serveStatic(url.pathname, res);
  } catch (e) {
    console.error("harness error", e);
    if (!res.headersSent) res.writeHead(500).end("harness error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Trivia 50 local harness on ${origin}`);
  console.log("Fake sign-in: admin@example.test / admin-pass (super_admin), player@example.test / player-pass (no role)");
});
