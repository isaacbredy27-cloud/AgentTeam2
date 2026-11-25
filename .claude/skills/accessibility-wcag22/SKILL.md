---
name: accessibility-wcag22
description: "WCAG 2.2 AA requirements for the trivia screens and the Agent Console. Use when designing, building or reviewing any UI."
---

# Accessibility, WCAG 2.2 AA

## Structure
- `<html lang="en">`. One `h1` per screen. Landmarks.
- Move focus to the heading when the screen changes.
- Each question is a `fieldset` with a `legend`.
- "Question 12 of 50" as text plus `<progress>`.

## Feedback
- Announce results in an `aria-live="polite"` region.
- Never colour alone. Add icon and text.
- After feedback, focus the Next button.

## Visual
- Contrast 4.5:1 text, 3:1 large text and UI parts.
- Target size at least 24×24 CSS px (WCAG 2.5.8). We use 44×44.
- Visible focus ring on every control.
- Works at 200% text size and from 320 px wide.

## Timing
- No timer by default. Any timer can be turned off or extended.

## Console
- Chat log is `role="log"`. Announce once when a reply ends, not per token.
- Diff lines marked with `+` and `−` text, not colour only.
- Approve confirmation is a `<dialog>` with focus trapped and returned.

---
Shared by: ux-designer-apple-hig, ui-designer-apple-liquid-glass, frontend-engineer, qa-engineer, agent-console-engineer. Lead: ux-designer-apple-hig.
