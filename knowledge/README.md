# Agent knowledge

Each agent in `.claude/agents/` has a folder here:

- `docs/`: reference notes taken from official documentation. Each note names its source link and read date (2026-11-25).
- `examples/`: small worked examples that show what good looks like. Code examples have tests.

Agents read their whole folder before answering and prefer it over memory (see each agent's `## Before you answer`).

## Run every example

```bash
npm install
```

```bash
npm run verify
```

`verify.mjs` runs each agent's `node --test` files, the Vitest and Playwright examples, a TypeScript check
and the team validator. Last run: 2026-11-25, all 12 steps passed.

Notes:
- The Playwright config defines iPhone 15 (WebKit) and Pixel 7 (Chromium). This cloud container only has Chromium,
  so `verify` runs Pixel 7. Install WebKit in CI with `npx playwright install webkit`.
- No example calls a paid or live service. Claude and GitHub calls run against fakes that replay documented shapes.
- `opentdb-integration-expert/examples/fixture-category-30.json` is a real Open Trivia DB response captured on 2026-11-25.

## Index

| Agent | Notes | Sources | Examples |
| --- | --- | --- | --- |
| [`agent-console-engineer`](agent-console-engineer/) | 4 | docs.github.com, platform.claude.com | `chat-stream.test.ts`, `chat-stream.ts`, `commit-files.test.ts`, `commit-files.ts` |
| [`frontend-engineer`](frontend-engineer/) | 3 | cheatsheetseries.owasp.org, developer.mozilla.org, vite.dev | `game.test.ts`, `game.ts`, `history.test.ts`, `history.ts` |
| [`meta-agent`](meta-agent/) | 2 | code.claude.com | `good-agent-file.md`, `validate-team.mjs` |
| [`mobile-pwa-expert`](mobile-pwa-expert/) | 3 | developer.mozilla.org, web.dev, webkit.org | `app`, `check-manifest.test.ts`, `offline.test.ts` |
| [`netlify-engineer`](netlify-engineer/) | 5 | docs.netlify.com | `agents-function.mts`, `agents-function.test.ts`, `claim-job.test.ts`, `claim-job.ts`, `netlify-toml.test.ts`, `netlify.toml` |
| [`opentdb-integration-expert`](opentdb-integration-expert/) | 3 | cheatsheetseries.owasp.org, developer.mozilla.org, opentdb.com | `decode.test.ts`, `decode.ts`, `fetch-round.test.ts`, `fetch-round.ts` |
| [`orchestrator`](orchestrator/) | 2 | code.claude.com | `handoff-routing.md`, `parallel-plan.md` |
| [`qa-engineer`](qa-engineer/) | 4 | opentdb.com, playwright.dev, vitest.dev | `e2e`, `fixture`, `playwright.config.ts`, `retry-wait.ts`, `retry-wait.vitest.test.ts` |
| [`security-expert`](security-expert/) | 6 | cheatsheetseries.owasp.org, docs.github.com | `password-and-session.test.ts`, `password-and-session.ts`, `path-rules.test.ts`, `path-rules.ts` |
| [`software-architect`](software-architect/) | 2 | cognitect.com, docs.netlify.com, opentdb.com | `adr-example.md`, `module-contracts.ts` |
| [`ui-designer-apple-liquid-glass`](ui-designer-apple-liquid-glass/) | 3 | developer.apple.com, developer.mozilla.org, w3.org | `contrast.test.ts`, `contrast.ts`, `glass-bar.html`, `glass-bar.test.ts`, `tokens.css` |
| [`ux-designer-apple-hig`](ux-designer-apple-hig/) | 3 | developer.apple.com, w3.org | `approve-dialog.html`, `approve-dialog.test.ts`, `copy-deck.md`, `round-flow.md` |
