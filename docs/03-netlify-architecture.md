# 03 · Architecture: static Netlify site plus Netlify Functions

Scope: repo layout, build, functions, limits, environment variables, storage and deploys.

Sources, read 2026-11-25:

- [Functions overview](https://docs.netlify.com/build/functions/overview/)
- [Configuration for functions](https://docs.netlify.com/build/functions/configuration/) (limits table)
- [Functions API reference](https://docs.netlify.com/build/functions/api/) (streaming)
- [Background Functions](https://docs.netlify.com/build/functions/background-functions/)
- [Environment variables and functions](https://docs.netlify.com/build/functions/environment-variables/)
- [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [Rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/)

## 1. Big picture

```
Browser (PWA)
 ├─ static files from Netlify CDN  (index.html, JS, CSS, sw.js, manifest)
 ├─ opentdb.com                     (questions, called directly — see doc 01)
 └─ /api/*  → Netlify Functions     (Agent Console only)
              ├─ Claude API         (key in env var)
              ├─ GitHub REST API    (token in env var)
              └─ Netlify Blobs      (sessions, proposals, jobs, audit log)
```

The trivia game needs **no server code**. It is a static site.
Functions exist only for the Agent Console (doc 04).

## 2. Repo layout

```
/
├─ index.html
├─ src/                    app code (trivia + console UI)
├─ public/                 manifest, icons, sw.js, static assets
├─ netlify/functions/      server code (TypeScript, .mts)
├─ .claude/agents/         agent definitions (*.md)
├─ docs/                   these research notes
├─ tests/                  unit and e2e tests
├─ netlify.toml
└─ package.json
```

Build tool: **Vite** with plain TypeScript. No UI framework is needed.
Vite outputs to `dist/`. Netlify publishes `dist/`.

Keep `netlify/functions/` outside the publish folder. Netlify docs advise this.

## 3. `netlify.toml` starting point

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  included_files = [".claude/agents/**"]

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; connect-src 'self' https://opentdb.com; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'"
```

`included_files` bundles agent files with the functions. The chat function reads them at runtime.

Do **not** put secrets in `netlify.toml`. Netlify docs state its env vars do not reach functions anyway.

## 4. Function style

Use the modern API. A function gets a web `Request` and returns a web `Response`.

```ts
// netlify/functions/agents.mts
import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  return Response.json({ ok: true });
};

export const config: Config = {
  path: "/api/agents",
  method: "GET",
};
```

Notes from the docs:

- Default URL is `/.netlify/functions/<name>`. A custom `path` replaces it.
- `path` supports `URLPattern` syntax. Named groups appear on `context.params`.
- `method` restricts HTTP methods.
- `.mts` files always run as ES modules.
- Runtime follows the build's Node version. Fallback is Node.js 24.
- `context` includes `ip`, `geo`, `requestId`, `cookies`, `params` and `waitUntil`.

## 5. Limits (from the configuration page)

| Setting | Default | Configurable? |
| --- | --- | --- |
| Region | `cmh` (US East, Ohio) | Yes (Pro and above) |
| Memory | 1024 MB | Yes (credit-based Pro and Enterprise) |
| Synchronous execution limit | **60 seconds** | No |
| Scheduled execution limit | 30 seconds | No |
| Background execution limit | **15 minutes** | No |
| Buffered request/response payload | 6 MB | No |
| Streamed response payload | 20 MB | No |
| Background request/response payload | **256 KB** | No |

The API reference adds: streaming functions have a **60-second** execution limit too.
Streaming helps the user see output early. It does **not** extend the time limit.

Background functions:

- Enable with `config.background = true`. The older `-background` file suffix still works.
- The client gets **202** at once. The work continues for up to 15 minutes.
- On error, Netlify **retries** after 1 minute, then again 2 minutes later.
  So background work must be **idempotent**.
- Results do not go back to the caller. Write them to Blobs instead.
- Available on credit-based plans, including Free, and on Enterprise.

## 6. Planned functions

> **Built 2026-11-25** (decision 0006): `/api/config`, `/api/me`, `/api/agents`, `/api/chat`, `/api/proposals/:id`,
> `/api/proposals/:id/approve`, `/api/proposals/:id/reject`. No login, logout or jobs functions. Rate limits sit on chat and approve.
> Shared code lives in `netlify/lib/`. See [plans/architecture.md](plans/architecture.md).

| Path | Method | Type | Job |
| --- | --- | --- | --- |
| `/api/login` | POST | sync | Check password. Set session cookie. |
| `/api/logout` | POST | sync | Clear session. |
| `/api/agents` | GET | sync | List agents: name, model, description. |
| `/api/chat` | POST | streaming | Chat with one agent. Stream text back. |
| `/api/proposals/:id` | GET | sync | Read one proposal and its diff. |
| `/api/proposals/:id/approve` | POST | sync | Commit to GitHub. |
| `/api/proposals/:id/reject` | POST | sync | Mark rejected. |
| `/api/jobs` | POST | sync | Create a long job. Trigger the worker. |
| `/api/jobs/:id` | GET | sync | Poll job status and output. |
| `/api/jobs-worker` | POST | background | Run the long agent job. |

All `/api/*` routes except `/api/login` check the session first.

## 7. Environment variables

> **Update 2026-11-25** (decision 0006): `CONSOLE_PASSWORD_HASH`, `SESSION_SECRET` and `WORKER_SECRET` are not used.
> Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (public, Functions scope, all contexts). The full table is in the root `README.md`.

| Name | Used by | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | chat, jobs-worker | Claude API key. |
| `GITHUB_TOKEN` | approve | Fine-grained token. One repo only. See doc 04. |
| `GITHUB_OWNER` | approve | Repo owner. |
| `GITHUB_REPO` | approve | Repo name. |
| `GITHUB_BRANCH` | approve | Usually `main`. |
| `CONSOLE_PASSWORD_HASH` | login | scrypt hash, not the plain password. |
| `SESSION_SECRET` | all `/api/*` | 32+ random bytes for signing cookies. |
| `WORKER_SECRET` | jobs, jobs-worker | Shared secret so only our code calls the worker. |

Rules from the Netlify docs:

- The variable's **scope must include Functions**.
- Read it with `process.env.NAME`. This is the form the docs show.
- Values are fixed **at deploy time**. Changing a value needs a new deploy.
- Set them in the UI, CLI or API. Not in `netlify.toml`.

Deploy contexts matter:

- Set `GITHUB_TOKEN` and `ANTHROPIC_API_KEY` for the **Production** context only.
- Deploy Previews then cannot spend money or push commits.

## 8. Netlify Blobs

A key–value store. Works from normal and background functions.

```ts
import { getStore } from "@netlify/blobs";

const proposals = getStore({ name: "proposals", consistency: "strong" });
await proposals.setJSON(id, proposal, { onlyIfNew: true });
const p = await proposals.get(id, { type: "json" });
```

Facts from the docs:

- Default consistency is **eventual**. Updates reach all edges within 60 seconds.
- `consistency: "strong"` makes updates visible at once. Reads are slower.
  Use strong for sessions, proposals and jobs.
- `set` supports `onlyIfNew` and `onlyIfMatch`. Use them to avoid double approvals.
- Store names: no `/` or `:`, max 64 bytes.
- Keys: max 600 bytes, cannot start with `/`.
- Object max 5 GB. Metadata max 2 KB.

Planned stores: `sessions`, `proposals`, `jobs`, `audit`, `ratelimit`.

## 9. Rate limiting

Set it in the function's `config`. A `path` is required.

```ts
export const config: Config = {
  path: "/api/chat",
  method: "POST",
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
```

- Over the limit, Netlify returns **429**.
- `windowSize` is in seconds. Maximum is **180**.
- Rules per project: Free/Starter/Personal 2, Pro 5, Enterprise with HP Edge 100.
- Function rate limits cannot be set in `netlify.toml`.

Decision 0004 keeps us on the Free plan, so we have 2 rules.
Spend them on `/api/login` and `/api/chat`.
Add a per-session budget in Blobs for everything else (doc 04).

## 10. Deploys

- Link the GitHub repo to the Netlify site.
- Every push to `main` triggers a production build and deploy.
- So a commit made by the approve function **is** the redeploy trigger.
- Decision 0003: Approve commits straight to `main`. No pull request step.
- Each pull request gets a Deploy Preview.
- Old deploys stay available for instant rollback.

A build hook is an alternative trigger. We do not need one here.

## 11. Local development

```bash
npm install -g netlify-cli
```

```bash
netlify dev
```

`netlify dev` serves the site and the functions together.
Put local secrets in a git-ignored `.env` file. Never commit it.
