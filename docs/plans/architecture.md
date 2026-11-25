# Architecture plan

Owner: software-architect (Atlas). Date: 2026-11-25.
Inputs: decisions 0001–0006, docs 01–05.

## Shape
- Static multi-page app built with Vite. No UI framework.
- Netlify Functions serve `/api/*` for the Agent Console only.
- The browser calls Open Trivia DB directly (0002).
- Supabase Auth signs admins in (0006). Supabase stores no app data.

## Pages (Vite inputs)
| URL | File | Owner |
| --- | --- | --- |
| `/` | `index.html` | Kit |
| `/agents/` | `agents/index.html` | Orin |
| `/how-it-works/` | `how-it-works/index.html` | Wren, Kit |
| `/resources/` | `resources/index.html` | Wren, Kit |
| `/guide/` | `guide/index.html` | Nico, Wren |
| `/offline.html` | `offline.html` | Rowan |

Every page shares one header nav and one footer with the attribution line.

## Modules
```
src/api/opentdb.ts        Pip. Categories, rounds, tokens, codes 0-5, 5 s gap.
src/quiz/game.ts          Kit. Shuffle, choices, scoring, streaks.
src/quiz/storage.ts       Kit. History and best scores. Never throws.
src/ui/*.ts               Kit. Screens. textContent only.
src/pwa/pwa.ts            Rowan. SW register, update prompt, install, iOS tip, offline banner.
src/console/*.ts          Orin. Auth client, agent list, chat, diff view, approve dialog.
src/styles/*.css          Sable. Tokens and components.
public/sw.js              Rowan. Precache list injected by scripts/build-sw.mjs.
netlify/functions/*.mts   Orin. Thin handlers: parse, call lib, respond.
netlify/lib/*.ts          Orin, Hollis. Auth, paths, diff, agents, GitHub, Blobs, HTTP helpers.
```
`netlify/lib/` sits outside the functions folder, so Netlify never treats it as a function.

## Functions
| Path | Method | Auth | Job |
| --- | --- | --- | --- |
| `/api/config` | GET | none | Public Supabase URL and anon key |
| `/api/me` | GET | signed in | Email and whether the user is `super_admin` |
| `/api/agents` | GET | super_admin | Agents with model, personality and knowledge files |
| `/api/chat` | POST | super_admin | Stream one chat turn. Store a proposal on `propose_change` |
| `/api/proposals/:id` | GET | super_admin | Read one proposal |
| `/api/proposals/:id/approve` | POST | super_admin | One commit to main |
| `/api/proposals/:id/reject` | POST | super_admin | Mark rejected |

No background jobs in v1. Chat uses low effort and `max_tokens` 8000 to stay well under 60 s.
Add the jobs pattern (doc 04 §8) only when a real task needs it.

## Testability rule
Each function exports `makeHandler(deps)`. The default export builds real deps from env.
Tests and the local harness pass fakes for Claude, GitHub, Blobs and Supabase.

## Data shapes
```ts
type Proposal = {
  id: string; agent: string; summary: string; createdBy: string; createdAt: string;
  status: "pending" | "committing" | "approved" | "rejected" | "stale" | "failed";
  files: { path: string; action: "create" | "update" | "delete"; content: string;
           baseSha: string | null; diff: string }[];
  commitSha?: string; commitUrl?: string; decidedBy?: string; decidedAt?: string;
};
```
Blobs stores: `proposals` and `audit`, both with strong consistency.

## What breaks first
- Chat over 60 s on a long answer. Mitigation: low effort, cap tokens, show a clear timeout message.
- Supabase outage blocks the console. The trivia game keeps working.
