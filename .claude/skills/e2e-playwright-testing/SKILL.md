---
name: e2e-playwright-testing
description: "Playwright end-to-end tests on phone presets with mocked APIs. Use when writing or running browser tests."
---

# End-to-end tests (Playwright)

- Projects: `iPhone 15` (WebKit) and `Pixel 7` (Chromium).
- Run with `--trace off`. Turn traces on only to debug.
- Mock OpenTDB and `/api/*` with `page.route`.

## Flows
1. Full round of 50. Correct final score.
2. Short category. Shorter round explained.
3. Rate-limit reply. App waits and retries.
4. Offline shell and offline message.
5. Service worker update prompt.
6. Manifest served with the right type and fields.
7. Console: login, agents, chat, proposal, approve (mocked).

Lighthouse has no PWA category now. Check installability in DevTools.

---
Shared by: qa-engineer, frontend-engineer, mobile-pwa-expert. Lead: qa-engineer.
