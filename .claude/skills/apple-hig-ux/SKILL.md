---
name: apple-hig-ux
description: "Apple HIG-based interaction rules and the app's core flows. Use when designing or building navigation, feedback or any user flow."
---

# Apple HIG and UX flows

## Principles
- Clarity: one main action per screen.
- Deference: content first. Chrome stays quiet.
- Depth: layers show hierarchy and where you are.
- Consistency: same control, same behaviour everywhere.

## Core flows
1. Topic picker → round loads (with cancel) → 50 questions.
2. Question → answer → instant feedback → Next.
3. Results → review list → Play again / New topic.
4. Console: login → agent list → chat → proposal diff → Approve or Reject.

## Interaction rules
- Touch targets at least 44×44 pt.
- Primary action within thumb reach, near the bottom.
- Feedback within 100 ms of a tap.
- Every error says what happened and what to do next.
- Destructive or irreversible actions ask once to confirm. Approve is one.
- Empty, loading, offline and error states designed for every screen.
- Back navigation always available. No dead ends.

---
Shared by: ux-designer-apple-hig, ui-designer-apple-liquid-glass, frontend-engineer. Lead: ux-designer-apple-hig.
