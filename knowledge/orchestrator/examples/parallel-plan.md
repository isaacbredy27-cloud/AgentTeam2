# Worked example: planning "Build the results screen" in parallel

## Goal
Players see their score, a review list and Play Again / New Topic after a round.

## Tasks
| # | Owner | Task | Files | Depends on |
| --- | --- | --- | --- | --- |
| 1 | ux-designer-apple-hig | Results flow, states, words, focus order | `docs/design/flows.md` | — |
| 2 | ui-designer-apple-liquid-glass | Glass action bar and result card tokens | `src/styles/tokens.css`, `docs/design/visual.md` | — |
| 3 | frontend-engineer | `result()` in quiz state + unit tests | `src/quiz/state.ts`, `tests/quiz.test.ts` | — |
| 4 | frontend-engineer | Results screen UI | `src/ui/results.ts` | 1, 2, 3 |
| 5 | qa-engineer | E2E + axe for results | `tests/e2e/results.spec.ts` | 4 |

## Run order
- **Batch A, in parallel (one turn, three Agent calls):** tasks 1, 2, 3. Different files, no shared inputs.
- **Then:** task 4, with the outputs of 1–3 pasted into its prompt.
- **Then:** task 5, then review by qa-engineer and Wren.

## A good delegation message (task 2)
> You are working on the Trivia PWA. Task: add tokens for the results screen's glass action bar and result card.
> Files you may change: `src/styles/tokens.css`, `docs/design/visual.md`. Do not touch `src/ui/`.
> Constraints: text on glass must stay ≥ 4.5:1 over black and white backdrops; iOS Safari ignores
> `prefers-reduced-transparency`. Acceptance: tokens exist for light and dark; contrast test passes.
> Reply with Result, Handoff, Open questions.

## Why this is good
Independent tasks start together. Each message stands alone. File lists never overlap within a batch.
