---
name: vite-tooling
description: "Vite build setup, npm scripts and output layout. Use when changing the build, scripts or dev tooling."
---

# Vite build and tooling

- Vite with plain TypeScript. No UI framework.
- Output to `dist/`. Netlify publishes `dist/`.
- Files in `public/` copy as-is. `sw.js` and the manifest live there.
- Only `VITE_`-prefixed env vars reach the client. Never prefix a secret.
- Scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`.
- Local full stack: `netlify dev` (site plus functions).
- Adding a dependency needs architect and security review. `package.json` is on the console deny-list.

---
Shared by: frontend-engineer, mobile-pwa-expert, netlify-engineer. Lead: frontend-engineer.
