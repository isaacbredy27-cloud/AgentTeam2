# Netlify Functions: API, config and limits

Sources (read 2026-11-25):
- https://docs.netlify.com/build/functions/overview/
- https://docs.netlify.com/build/functions/configuration/
- https://docs.netlify.com/build/functions/api/

## Shape
A function receives a web `Request` and a `Context` and returns a `Response`.
```ts
import type { Config, Context } from "@netlify/functions";
export default async (req: Request, context: Context) => new Response("Hello, world!");
export const config: Config = { path: "/hello" };
```
- Default URL: `https://<YOUR DOMAIN>/.netlify/functions/<FUNCTION NAME>`.
  "When you set a custom `path`, the function is only available at that path."
- `path` can be an array and supports `URLPattern`. Named groups land on `context.params`.
- `excludedPath`, `preferStatic: true` and `method` refine routing.
- Context fields: `account`, `cookies`, `deploy`, `geo`, `ip`, `params`, `requestId`, `server`, `site`, `user`, `waitUntil`.
- Stream by returning a `ReadableStream` as the `Response` body.

## Default values (quoted table)
| Setting | Default | Configurable? |
| --- | --- | --- |
| Region | `cmh` (US East, Ohio) | Yes (Pro and Enterprise) |
| Memory | 1024 MB | Yes (credit-based Pro and Enterprise) |
| Synchronous execution limit | 60 seconds | No |
| Scheduled execution limit | 30 seconds | No |
| Background execution limit | 15 minutes | No |
| Buffered request/response payload | 6 MB | No |
| Streamed response payload | 20 MB | No |
| Background request/response payload | 256 KB | No |
Binary request bodies are Base64-encoded, so the effective binary upload limit is about 4.5 MB.
"Streaming functions have a 60-second execution limit and a 20 MB response size limit."

## Runtime and modules
- Node version follows the build. Fallback is Node.js 24. Override with env var `AWS_LAMBDA_JS_RUNTIME` (UI/CLI/API only).
- `.mts`/`.mjs` run as ES modules. `.cts`/`.cjs` as CommonJS. `.ts`/`.js` follow the nearest `package.json` `type`.
- Default directory `netlify/functions`. Keep it outside the publish directory.

## Background functions
Source: https://docs.netlify.com/build/functions/background-functions/
- Enable with `config.background = true` (the `-background` filename suffix still works).
- Client gets `202` at once. Runs up to 15 minutes.
- On error: "a retry happens after one minute. If it fails again, another retry happens two minutes later."
- Available on credit-based plans including Free, and on Enterprise.
