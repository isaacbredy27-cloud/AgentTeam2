---
name: accessibility-testing
description: "axe-core checks plus keyboard and screen reader passes. Use when testing any screen for accessibility."
---

# Accessibility testing

## Automated
```ts
import AxeBuilder from "@axe-core/playwright";
const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();
expect(r.violations).toEqual([]);
```
Screens: topic, question, feedback, results, console login, chat, diff.

## Manual, per new screen
- Keyboard only: every action works, logical order, visible focus.
- VoiceOver on iPhone and TalkBack on Android.
- 200% text size and 320 px width.
- Reduced motion and reduced transparency on.

Automated tools catch only part of the issues. Do the manual pass.

---
Shared by: qa-engineer, ux-designer-apple-hig, frontend-engineer. Lead: qa-engineer.
