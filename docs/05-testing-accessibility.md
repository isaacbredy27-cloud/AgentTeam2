# 05 · Testing and accessibility

Scope: how we test the trivia app, the PWA and the Agent Console. How we meet accessibility needs.

Target standard: **WCAG 2.2 level AA**.

## 1. Test layers

| Layer | Tool | Covers |
| --- | --- | --- |
| Unit | Vitest | Pure logic: decode, shuffle, scoring, storage, path rules, frontmatter |
| Function | Vitest + web `Request` objects | Each Netlify Function, with fakes for Claude, GitHub and Blobs |
| End-to-end | Playwright | Real browser flows on phone viewports |
| Accessibility | axe-core via `@axe-core/playwright`, plus manual checks | WCAG rules |
| Manual device | Real iPhone and Android phone | Install, offline, screen readers |

Run unit, function and e2e tests in CI on every pull request.
Run e2e tests against the Netlify Deploy Preview URL too.

## 2. Unit tests: trivia

- `decode`: URL-encoded text with quotes, `&`, `π` and emoji.
- `shuffle`: keeps all items. No duplicates. Rough uniformity over many runs.
- `boolean` questions keep True, False order.
- Scoring: correct, wrong, streak reset, best streak.
- Storage: works when `localStorage` throws.
- API client, one test per response code 0–5.
- Code 1 path: falls back to the count endpoint, then a smaller `amount`.
- Code 5 path: waits at least 5 seconds. Use fake timers.

Use recorded JSON fixtures for OpenTDB. Never call the real API in CI.
It would hit the 5-second rate limit and make tests flaky.

## 3. Function tests: Agent Console

Security tests matter most here. Write them first.

- Login: right password passes. Wrong password fails. Lockout after N failures.
- Every `/api/*` route except login returns 401 without a session.
- POST without the CSRF header or with a foreign `Origin` returns 403.
- Path validation, table-driven:
  - Allowed: `src/ui/topic.ts`, `docs/notes.md`.
  - Denied: `../x`, `/etc/passwd`, `src/../netlify.toml`, `netlify/functions/chat.mts`,
    `.github/workflows/ci.yml`, `package.json`, `.env`, `public/sw.js`, `src\\x.ts`, `src/%2e%2e/x`.
- Size and count limits on proposals.
- Approve: pending → approved once. A second approve fails.
- Approve with a changed base SHA marks the proposal `stale`. No commit happens.
- Responses never contain env var values. Grep the JSON in the test.
- Model alias map: `opus`, `sonnet`, `haiku`, `inherit` and unknown IDs.
- Background worker: a second run for the same job exits early.

Fakes:

- Claude: a fake client that yields scripted stream events, including a `tool_use` block.
- GitHub: a fake `fetch` that records calls and returns 200, 201, 409 or 422.
- Blobs: an in-memory map with the same `get`, `setJSON` and `onlyIfMatch` behaviour.

One manual smoke test per release can call the real APIs. Use a throwaway branch, not `main`.

## 4. End-to-end tests (Playwright)

Run with `--trace off` by default. Turn traces on only to debug a failure.

Projects:

- `iPhone 15` device preset (WebKit).
- `Pixel 7` device preset (Chromium).

Flows:

1. Pick a topic. 50 questions load. Answer all. Results show the right score.
2. Topic with fewer than 50 questions. The app explains the shorter round.
3. Rate-limit response from the mocked API. The app waits and retries.
4. Offline: the shell loads. The topic screen shows the offline message.
5. Service worker registers. A new version shows the update prompt.
6. Manifest loads with the right MIME type and required members.
7. Console: login, list agents, chat (mocked), see a proposal, approve (mocked GitHub).

Mock OpenTDB and `/api/*` with `page.route`. Keep tests fast and stable.

Lighthouse no longer has a PWA category. Check installability in DevTools → Application instead.

## 5. Manual device checks (each release)

- Android Chrome: install prompt, launch from icon, offline shell, TalkBack pass.
- iPhone Safari: Add to Home Screen, standalone launch, VoiceOver pass.
- Text size at 200% in OS settings. Nothing clips or overlaps.
- Landscape on a small phone. Nothing is hidden.

## 6. Accessibility: trivia screens

Structure:

- `<html lang="en">`. One `<h1>` per screen. Landmarks: `header`, `main`, `footer`.
- Move focus to the screen heading when the screen changes.
- Each question is a `fieldset` with a `legend`. Answers are buttons or radio inputs.
- Show "Question 12 of 50" as text. Use a `<progress>` element too.

Feedback:

- After an answer, announce "Correct" or "Wrong. The answer is X." in an `aria-live="polite"` region.
- Do not rely on colour alone. Add an icon and text.
- Move focus to the "Next question" button after feedback.

Visual:

- Text contrast at least 4.5:1. Large text and UI parts at least 3:1.
- Touch targets at least 24×24 CSS px (WCAG 2.2 minimum). Aim for 44×44.
- Visible focus ring on every control. Do not remove `outline` without a replacement.
- Respect `prefers-reduced-motion`. Turn off answer animations.
- Respect `prefers-color-scheme`. Check contrast in both themes.
- Layout works from 320 px wide. No horizontal scroll.

Timing:

- No timer by default.
- If a timer is added, let users turn it off or extend it (WCAG 2.2.1).

Content:

- Decode question text before display. Screen readers must not read `&quot;`.
- Results review uses a list. Each item says "Your answer" and "Correct answer" in words.

## 7. Accessibility: Agent Console

- Login: a visible `<label>` for the password. Errors linked with `aria-describedby`.
- Agent list: a list of buttons or links. The model is text, not colour only.
- Chat log: `role="log"`. Do not announce every streamed token.
  Announce once when the reply ends: "Reply from ui-designer finished."
- A "Stop" button during streaming.
- Diff view: label added and removed lines in text, not only red and green.
  For example prefix lines with `+` and `−`, and add a legend.
- Approve confirmation is a real `<dialog>` with focus trapped and returned.
- Keyboard: every action works without a mouse. Logical tab order.

## 8. Automated a11y in CI

```ts
import AxeBuilder from "@axe-core/playwright";

const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
  .analyze();
expect(results.violations).toEqual([]);
```

Run it on: topic screen, a question, feedback state, results, console login, console chat, diff view.
Automated tools catch only part of the issues. Keep the manual screen reader pass.

## 9. Definition of done (per feature)

- Unit and function tests pass.
- E2E flow passes on both device presets.
- axe reports no violations on the touched screens.
- Keyboard-only walk-through done.
- One screen reader pass done for new screens.
- No secret appears in the client bundle. CI greps `dist/` for key patterns.
