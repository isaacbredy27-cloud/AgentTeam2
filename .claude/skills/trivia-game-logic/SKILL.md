---
name: trivia-game-logic
description: "Rules for quiz state, answer shuffling, scoring, streaks and score history. Use when building or testing the game flow."
---

# Trivia game logic

## Round
- One round is up to 50 questions from one category.
- If the category has fewer, the round is shorter. Tell the user.

## Answers
- Choices: `[correct_answer, ...incorrect_answers]`, shuffled with Fisher–Yates.
- Never `sort(() => Math.random() - 0.5)`.
- Boolean questions: fixed order True, False.
- Keep the correct index in state. Never read it from the DOM.

## Scoring
- One point per correct answer. Show "17 / 50" and a percentage.
- Track current streak and best streak.
- Difficulty weighting stays off by default.

## Results
- Final score, score by difficulty, review list of every question.
- Actions: play again (same topic), pick a new topic.

## History
- Save `{ categoryId, score, total, date }` per round.
- Show best score per category on the topic screen.
- Wrap storage calls in try/catch.

Details: `docs/01-trivia-opentdb.md`, sections 7–8.

---
Shared by: frontend-engineer, opentdb-integration-expert, qa-engineer. Lead: frontend-engineer.
