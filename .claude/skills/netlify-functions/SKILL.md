---
name: netlify-functions
description: "Modern Netlify Functions API, config object and hard limits. Use when writing, configuring or reviewing a function."
---

# Netlify Functions

## Shape
```ts
import type { Config, Context } from "@netlify/functions";
export default async (req: Request, context: Context) => Response.json({ ok: true });
export const config: Config = { path: "/api/agents", method: "GET" };
```
- Folder: `netlify/functions/`. Use `.mts`.
- Custom `path` replaces `/.netlify/functions/<name>`. `URLPattern` groups land on `context.params`.
- `context` has `ip`, `geo`, `requestId`, `cookies`, `params`, `waitUntil`.
- Stream by returning a `ReadableStream` body.

## Limits (fixed)
| Setting | Value |
| --- | --- |
| Sync and streaming execution | 60 s |
| Scheduled execution | 30 s |
| Background execution | 15 min |
| Buffered payload | 6 MB |
| Streamed response | 20 MB |
| Background payload | 256 KB |
| Memory | 1024 MB |

## Free plan notes
- Region stays `cmh` (Ohio). Region and memory changes need Pro.
- Background functions are available on Free.

---
Shared by: netlify-engineer, agent-console-engineer, software-architect, security-expert. Lead: netlify-engineer.
