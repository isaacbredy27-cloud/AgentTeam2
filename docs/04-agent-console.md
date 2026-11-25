# 04 · Agent Console: chat with agents, approve code changes

Scope: a password-protected page in the deployed app. It lists every agent in `.claude/agents`.
Users chat with any agent. Agents propose code changes. A change reaches GitHub only after the user clicks **Approve**.
The commit triggers a Netlify redeploy.

Sources, read 2026-11-25:

- Claude API: Messages API, models, tool use and streaming. Read via the official Claude API reference bundled with Claude Code.
  Live docs: <https://platform.claude.com/docs>.
- [GitHub REST: repository contents](https://docs.github.com/en/rest/repos/contents)
- [GitHub: managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- Netlify docs listed in doc 03.

## 1. Flow

```
User ──password──▶ /api/login ──▶ signed session cookie
User ──"list"────▶ /api/agents ─▶ name, model, description for each agent
User ──message───▶ /api/chat ───▶ Claude API (stream) ──▶ text to browser
                                   │
                                   └─ agent calls tool propose_change
                                       ▶ function validates paths
                                       ▶ saves proposal in Blobs (status: pending)
                                       ▶ browser shows diff + Approve / Reject
User ──Approve───▶ /api/proposals/:id/approve
                                   ▶ re-validate, check SHAs
                                   ▶ one commit to GitHub via REST
                                   ▶ Netlify sees the push and redeploys
```

The model never holds the GitHub token. It can only **propose**.
Only a human click on Approve can write to the repo.

## 2. Agent files

Agents live in `.claude/agents/*.md`. This is the Claude Code subagent format.
Each file has YAML frontmatter and a Markdown body.

```markdown
---
name: ui-designer
description: Designs accessible, mobile-first screens for the trivia app.
model: sonnet
tools: Read, Edit
---
You are a calm, precise UI designer. You favour plain layouts...
```

Field mapping for the console:

| Console shows | Source |
| --- | --- |
| Name | `name` |
| Model | `model` (resolved, see below) |
| Personality | Markdown body. Show a short preview; use the full text as the system prompt. |
| Description | `description` |

Model resolution. Claude Code allows aliases. The API needs full IDs.

| `model` value | API model ID |
| --- | --- |
| `opus` | `claude-opus-5-5` |
| `sonnet` | `claude-sonnet-5-5` |
| `haiku` | `claude-haiku-5-5` |
| `inherit` or missing | `claude-opus-5-5` (console default) |
| A full ID | Use it if it is on an allow-list. Otherwise reject. |

Keep the map in one file. Update it when new models ship.

Reading the files:

- `netlify.toml` bundles them with `included_files = [".claude/agents/**"]`.
- `/api/agents` parses frontmatter and returns name, model, description and a short preview.
- `/api/chat` loads the full body as the system prompt. Look up by `name`. Never by a raw file path from the client.

The `tools` field is a Claude Code setting. The console ignores it.
Console agents get exactly one tool: `propose_change`.

## 3. Chat function

Use the official TypeScript SDK, `@anthropic-ai/sdk`. Stream the reply.

```ts
// netlify/functions/chat.mts (sketch)
import Anthropic from "@anthropic-ai/sdk";
import type { Config, Context } from "@netlify/functions";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

export default async (req: Request, context: Context) => {
  const session = await requireSession(req);           // 401 if missing
  const { agentName, messages } = await parseChat(req);   // validate shape and size
  const agent = await loadAgent(agentName);               // 404 if unknown

  const stream = client.messages.stream({
    model: agent.modelId,
    max_tokens: 8000,
    system: agent.systemPrompt + CONSOLE_RULES,
    tools: [PROPOSE_CHANGE_TOOL],
    messages,
  });

  const body = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          controller.enqueue(enc.encode(sse("text", event.delta.text)));
        }
      }
      const final = await stream.finalMessage();
      const proposalId = await handleToolUse(final, session, agent); // validates + stores
      controller.enqueue(enc.encode(sse("done", { stop: final.stop_reason, proposalId })));
      controller.close();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
};

export const config: Config = {
  path: "/api/chat",
  method: "POST",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
```

Claude API facts that shape this code:

- Default model is `claude-opus-5-5`. It costs $4 / $20 per million input / output tokens.
  `claude-sonnet-5-5` costs $2 / $10. `claude-haiku-5-5` costs $0.10 / $0.50.
- On Opus 5.5, thinking **cannot be disabled**. Effort is the control.
  Its default effort is `medium`. Set `output_config: { effort: "low" }` for quick chat.
- Opus 5.5 and Sonnet 5.5 reject forced `tool_choice` (`any` or `tool`) with a 400.
  Use `tool_choice: auto` and `strict: true` on the tool.
- Assistant prefill returns a 400 on current models.
- Check `stop_reason` before reading content. Handle `end_turn`, `tool_use`, `max_tokens` and `refusal`.
- For Opus 5.5 and Sonnet 5.5, add server-side refusal fallbacks:
  beta `server-side-fallback-2026-07-01` with `fallbacks: "default"`.
- Parse tool input with `JSON.parse` or SDK types. Never string-match it.
- Use SDK error classes (`Anthropic.RateLimitError` and others). Map 429 and 5xx to a friendly retry message.
- With streaming and client tools, set `eager_input_streaming: true` on the tool.
  Then validate the parsed input against the schema before use.

Conversation state:

- Keep the message history in the browser for the session.
- Send it with each request. Cap total size, for example 200 KB.
- Pass `response.content` back unchanged on the next turn. This keeps thinking blocks valid.

## 4. The `propose_change` tool

```ts
const PROPOSE_CHANGE_TOOL = {
  name: "propose_change",
  description:
    "Propose file changes for human review. Nothing is written until a human approves. " +
    "Use full file contents. Only paths under the allowed folders are accepted.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "files"],
    properties: {
      summary: { type: "string", description: "One-line commit message." },
      files: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["path", "action", "content"],
          properties: {
            path: { type: "string" },
            action: { type: "string", enum: ["create", "update", "delete"] },
            content: { type: "string", description: "Full new file text. Empty for delete." },
          },
        },
      },
    },
  },
};
```

When the model calls the tool, the function:

1. Validates every path (section 6).
2. Reads the current file and its blob SHA from GitHub. Stores them as the base.
3. Builds a unified diff for display.
4. Saves the proposal in Blobs with `status: "pending"`.
5. Builds a `tool_result` for that `tool_use` ID: "Proposal P-123 saved. Waiting for human approval."
   If validation failed, it sends the reason with `is_error: true`.
6. Sends the proposal ID and the `tool_result` to the browser.
   The browser appends both to the history, so the next turn stays valid.

The browser shows the summary, the file list and the diff.
Buttons: **Approve**, **Reject**.

## 5. Approve: committing to GitHub

On Approve, the function:

1. Checks the session and a CSRF check (section 7).
2. Loads the proposal. It must be `pending`.
3. Re-runs path validation. Never trust the stored copy alone.
4. Checks each file's current SHA against the stored base SHA.
   If one changed, mark the proposal `stale`. Ask the agent to redo it.
5. Writes the commit.
6. Sets `status: "approved"` with `onlyIfMatch` on the ETag. This blocks double approval.
7. Logs who approved, when, the commit SHA and the file list.
8. Returns the commit URL.

### Single file: Contents API

`PUT /repos/{owner}/{repo}/contents/{path}`

- Body: `message`, `content` (Base64), `branch`.
- `sha` is **required when updating** an existing file.
- Headers: `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2026-03-10`.
- Codes: 200 updated, 201 created, 404, **409 conflict**, 422 validation failed.
- GitHub warns: parallel create/update and delete calls conflict. Run them **serially**.
- Needs fine-grained permission **Contents: write**.
  Files under `.github/workflows` also need **Workflows: write**. We will not grant it.

### Several files: one atomic commit

Many file writes through the Contents API make many commits and many deploys.
Use the Git Data API for one commit instead. It uses the same Contents permission.

1. `GET /repos/{o}/{r}/git/ref/heads/main` → current commit SHA.
2. `GET /repos/{o}/{r}/git/commits/{sha}` → its tree SHA.
3. `POST /repos/{o}/{r}/git/trees` with `base_tree` and the changed paths.
   For a delete, set the entry's `sha` to `null`.
4. `POST /repos/{o}/{r}/git/commits` with the new tree and the parent.
5. `PATCH /repos/{o}/{r}/git/refs/heads/main` with the new SHA. Keep `force: false`.

If step 5 fails because `main` moved, re-check SHAs and retry once.

Netlify sees the push to `main`. It builds and deploys. Show a "Deploying…" note.
Optional: poll the Netlify deploy API for status. That needs a Netlify token, so skip it in v1.

## 6. Path allow-list

Agents may change only these paths (starting proposal):

```
src/**
public/**        (except public/sw.js — see below)
docs/**
tests/**
index.html
```

Always deny, even if the allow-list changes later:

```
netlify/functions/**     the console's own security code
netlify.toml             headers, CSP, function config
.claude/**               agent definitions and prompts
.github/**               CI and workflows
package.json, package-lock.json   new dependencies = supply-chain risk
.env*, *.pem, *.key      secrets
public/sw.js             a bad worker can stick on devices
```

Validation rules:

- Normalize with POSIX path rules. Reject if the result differs from the input.
- Reject `..`, leading `/`, backslashes, `//`, null bytes and control characters.
- Reject hidden path segments starting with `.`, except an explicit allow.
- Match against the allow-list **and** the deny-list. Deny wins.
- Limit files per proposal, for example 20.
- Limit size per file, for example 200 KB. Text only. Valid UTF-8.
- Reject a `create` if the file exists. Reject an `update` or `delete` if it does not.

Keep the lists in code under `netlify/functions/`. Agents cannot edit that folder.

## 7. Security

### Password gate

- Store only a hash: `CONSOLE_PASSWORD_HASH` (scrypt from `node:crypto`, with salt).
- Compare with `crypto.timingSafeEqual`.
- On success, set a session cookie:
  `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800`.
- Sign the cookie with `SESSION_SECRET` (HMAC-SHA256). Also store the session in Blobs so logout can revoke it.
- Rate-limit `/api/login` hard, for example 5 per 60 seconds per IP.
- After 10 failures, lock the console for 15 minutes. Track this in Blobs.
- Netlify also offers site-wide password protection on some plans. It can be a second layer.

### CSRF

- `SameSite=Strict` blocks most cross-site posts.
- Also require a custom header, for example `X-Console: 1`, on every POST.
- Check the `Origin` header equals the site URL.

### GitHub token

Create a **fine-grained personal access token**:

- Resource owner: the account that owns the repo.
- Repository access: **Only select repositories** → this one repo.
- Permissions: **Contents: Read and write**. **Metadata: Read** comes with it.
- Grant nothing else. No Workflows, no Actions, no Administration.
- Expiration: 90 days or less. Put a renewal reminder in the team calendar.
- Store it as `GITHUB_TOKEN` in Netlify. Scope: Functions. Context: Production.
- GitHub says: "Treat your access tokens like passwords."

If the repo is in an organization, an admin may need to approve the token first.
A GitHub App is the more scalable option later. A token is fine for one repo.

Optional hardening: add a branch ruleset on `main` that blocks force pushes and deletion.

### No secrets in the browser

- The browser never receives `ANTHROPIC_API_KEY`, `GITHUB_TOKEN` or any hash.
- Functions never echo `process.env`. Error messages stay generic.
- Logs never print tokens, cookies or full prompts.
- The CSP in doc 03 blocks third-party scripts.
- Build-time code must not read these variables into the bundle.
  With Vite, only `VITE_`-prefixed vars reach the client. Never prefix a secret.

### Rate limits and spend caps

- Netlify `rateLimit` on `/api/login` and `/api/chat` (doc 03).
- Per-session budget in Blobs, for example 50 chat turns or 500k tokens a day.
  Read `usage` from each response to count tokens.
- `max_tokens` cap on every request.
- Set a monthly spend limit in the Anthropic Console.
- Limit message history size and count per request.

### Prompt injection

- Agent output is **untrusted**. A crafted message can make an agent propose bad code.
- Defence: the allow-list, the deny-list and the human Approve step.
- The diff view must show the full change. No hidden or collapsed files.
- Render agent text with `textContent` or a safe Markdown renderer. Never raw HTML.

### Audit log

Write one record per login, proposal, approval and rejection to the `audit` store.
Include time, session ID, agent, files and commit SHA.

## 8. Long agent jobs and Netlify time limits

Limits (doc 03): synchronous and streaming functions stop at **60 seconds**.
Background functions run up to **15 minutes**. Their payload limit is **256 KB**.

Plan by job length:

| Expected time | Pattern |
| --- | --- |
| Under ~45 s | Streaming chat function. Use low effort and a modest `max_tokens`. |
| 45 s to ~14 min | Background job with polling. |
| Longer | Split into steps, one background run per step. Or move to Anthropic Managed Agents. |

### Background job pattern

1. Browser `POST /api/jobs` with agent name and task.
2. Function creates `jobs/<id>` in Blobs: `{ status: "queued" }` (strong consistency).
3. Function calls `/api/jobs-worker` with the job ID and `WORKER_SECRET`. Netlify replies 202.
4. Worker sets `running`. It calls Claude with streaming.
   It writes partial text to Blobs every few seconds.
5. If the agent proposes a change, the worker stores a pending proposal. Same rules as chat.
6. Worker sets `done` or `error` with a short message.
7. Browser polls `GET /api/jobs/<id>` every 2–3 seconds. It stops on `done` or `error`.

Idempotency. Netlify retries a failed background run after 1 minute and 2 minutes.

- The worker checks the job status first. It exits if the job is already `running` or finished.
- Claim the job with `onlyIfMatch` on the ETag. Only one run wins.
- Approval stays a separate human step. A retry can never commit code.

Time budget inside the worker:

- Stop starting new Claude calls after about 13 minutes.
- Save progress and mark `partial`. The user can continue in a new job.
- Use a task budget or a lower effort to keep agent loops short.

### Managed Agents option

Anthropic offers **Managed Agents** (beta). Anthropic hosts the agent loop and a sandbox.
Sessions can run far longer than 15 minutes.
The Netlify function would only start a session and relay events.
It bills session runtime on top of tokens. It keeps session history until deleted.
Consider it if agents need long multi-step work. Keep v1 on the Messages API for simplicity.

## 9. Console UI checklist

- Login screen with one password field.
- Agent list: name, model badge, one-line description, personality preview.
- Chat pane per agent. Messages in a `role="log"` region.
- Proposal card: summary, file list, full diff, Approve and Reject.
- Approve asks for a second click: "Commit 3 files to main?"
- After approval: commit link and "Deploy started" note.
- Logout button. Session expiry warning.
- The console route is not cached by the service worker.
- The console is excluded from any native store build.
