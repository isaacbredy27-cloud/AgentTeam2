---
name: static-plus-functions-architecture
description: "The agreed architecture: static PWA on Netlify plus Netlify Functions for Claude and GitHub calls, no other servers. Use when designing or placing any code."
---

# Static site plus Functions

## The decision
- Static front end on the Netlify CDN.
- Netlify Functions only for Claude API and GitHub calls (the Agent Console).
- No other servers, databases or proxies.
- The browser calls Open Trivia DB directly. No proxy.
- Plan: Netlify Free.

## Layout
```
src/                 app code (trivia + console UI)
public/              manifest, icons, sw.js
netlify/functions/   server code (.mts)
.claude/agents/      agent definitions
docs/                research and decisions
tests/               unit, function, e2e
```

## Rules
- Game logic never needs a function.
- Every secret lives in a function env var. Never in `src/` or `public/`.
- Storage: browser storage for scores; Netlify Blobs for console state.
- New service, server or dependency needs a decision record first.

Details: `docs/03-netlify-architecture.md`.

---
Shared by: software-architect, netlify-engineer, agent-console-engineer, security-expert. Lead: software-architect.
