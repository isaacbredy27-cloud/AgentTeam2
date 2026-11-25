# Trivia 50

An installable trivia web app (PWA) on Netlify, with an Agent Console where an admin chats
with the 12-agent team and approves code changes.

- Play: pick a topic, answer up to 50 questions from [Open Trivia DB](https://opentdb.com/), see your score and a review.
- Install: Android shows an Install button. On iPhone, tap Share, then Add to Home Screen.
- Agents page: Supabase sign-in (email and password, or Google). Only `super_admin` users can use it.
- Pages: `/how-it-works/`, `/resources/`, and the setup guide at `/guide/`.

Team guide: [`CLAUDE.md`](CLAUDE.md). Docs index: [`docs/README.md`](docs/README.md).
Build plans: [`docs/plans/`](docs/plans/README.md). Decisions: [`docs/decisions/`](docs/decisions/README.md).

## Run it locally

Needs Node.js 22.18 or newer.

```bash
npm install
```

```bash
npm run build
```

```bash
npm run preview:local
```

Open <http://127.0.0.1:8888>. The local harness serves `dist/` and runs the real function code with real
`Request` objects. Supabase, Claude and GitHub are fakes, so you need no keys.
Fake accounts: `admin@example.test` / `admin-pass` (super_admin) and `player@example.test` / `player-pass` (no role).

With real services, use the Netlify CLI and a git-ignored `.env` file:

```bash
npx netlify-cli dev
```

## Tests

```bash
npm run verify
```

That runs the type check, Vitest unit and function tests, the build, a secret scan of `dist/`,
and Playwright end-to-end tests with axe checks. Playwright runs on Chromium with two phone projects:
Pixel 7 and an iPhone-sized viewport. Install WebKit in CI to add a true iPhone run.

## Deploy to Netlify

Full steps: the `/guide/` page on the deployed site (source: `scripts/pages/guide.html`).

1. Import the repo in Netlify. `netlify.toml` sets the build (`npm run build`) and publish folder (`dist`).
2. Set up Supabase Auth (below).
3. Add the environment variables (below). Then deploy.
4. Every push to `main` deploys. An approved console proposal commits to `main`, so it deploys too.
5. Bad deploy: in Netlify, publish the previous deploy. Then revert the commit.

## Environment variables

Set these in Netlify: Project configuration, Environment variables. Never in `netlify.toml`.
None of them use the `VITE_` prefix, so none reach the browser bundle.

| Name | Scope | Context | Public or secret | Where to get it |
| --- | --- | --- | --- | --- |
| `SUPABASE_URL` | Functions | All | Public | Supabase: Project Settings, API, Project URL |
| `SUPABASE_ANON_KEY` | Functions | All | Public | Supabase: Project Settings, API, `anon` public key |
| `ANTHROPIC_API_KEY` | Functions | Production only | **Secret** | Claude Console, API keys |
| `GITHUB_TOKEN` | Functions | Production only | **Secret** | GitHub fine-grained token: this repo only, Contents read and write, 90 days or less |
| `GITHUB_OWNER` | Functions | All | Public | `isaacbredy27-cloud` |
| `GITHUB_REPO` | Functions | All | Public | `AgentTeam2` |
| `GITHUB_BRANCH` | Functions | All | Public | `main` (default) |

The browser gets the Supabase URL and anon key from `GET /api/config`. They are public by design.
The two secrets exist only in Production, so Deploy Previews cannot spend money or push commits.

## Supabase setup

1. Create a project. Copy the Project URL and the anon key into the env vars above.
2. Authentication, Sign In / Providers: keep **Email** on. Advised: turn off new sign-ups and invite admins.
3. Authentication, URL Configuration: set **Site URL** to your Netlify URL.
   Add **Redirect URLs** `https://<your-site>.netlify.app/agents/` and `http://localhost:8888/agents/`.
4. Google: in Google Cloud Console create an OAuth client (Web application).
   Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
   Paste the client ID and secret into Supabase, Sign In / Providers, Google.
5. Grant `super_admin` in the SQL Editor. The role lives in `app_metadata`, which users cannot edit:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"super_admin"}'::jsonb
where email = 'admin@your-domain.com';
```

Remove it with `raw_app_meta_data - 'role'`. Every console function checks the role on every request
by asking Supabase who the token belongs to (`GET /auth/v1/user`). No token: 401. Wrong role: 403.

## How the console is protected

- Agents can only propose. Nothing reaches GitHub until a human clicks Approve and confirms.
- Approve re-checks paths and file SHAs, claims the proposal so a second approve fails, then makes
  one commit through the Git Data API with `force: false`.
- Agents may only change `src/`, `public/` (not `public/sw.js`), `docs/`, `tests/` and the page HTML files.
- Free plan rate limits: `/api/chat` 20 per minute, approve 10 per minute.
- Decision record: [`docs/decisions/0006-supabase-auth-for-agent-console.md`](docs/decisions/0006-supabase-auth-for-agent-console.md).

## Layout

```
index.html, agents/, how-it-works/, resources/, guide/, offline.html   pages (generated by scripts/gen-pages.py)
src/api/opentdb.ts      Open Trivia DB client
src/quiz/               game logic and score history
src/ui/                 trivia screens
src/pwa/pwa.ts          service worker registration, install, offline banner
src/console/            Agent Console UI
public/                 manifest, icons, sw.js
netlify/functions/      /api/* functions
netlify/lib/            auth, path rules, diff, GitHub, proposals, chat
scripts/                icons, service worker build step, secret scan, local harness
tests/                  unit, function and Playwright tests, plus fakes
```

Questions from the Open Trivia Database (opentdb.com), licensed CC BY-SA 4.0.
