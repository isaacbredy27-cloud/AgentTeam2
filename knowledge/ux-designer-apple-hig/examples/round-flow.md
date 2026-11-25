# Worked example: the round flow, with every state

Shows what a good flow spec looks like: every screen, every state, the exact words, and the focus target.

## 1. Topic picker
| State | What people see | Primary action | Focus on enter |
| --- | --- | --- | --- |
| Default | "Pick a Topic" + 24 topic buttons, best score under each | Tap a topic | Screen heading |
| Offline | Banner: "You're offline. New questions need a connection." Topics disabled | — | Banner |
| Loading round | "Getting 50 questions…" + Cancel | Cancel | Status text |
| Short topic | "This topic has 40 questions. Your round has 40." | Start | Message |
| Error | "Couldn't get questions. Check your connection and try again." | Try Again | Message |

## 2. Question
- Heading: "Question 12 of 50". Progress bar below.
- Question text in a `legend`. Answers as full-width buttons, 44 pt tall or more.
- After a tap: answers lock. Feedback appears in a live region:
  - Right: "Correct." with a check icon.
  - Wrong: "Wrong. The answer is Mars." with a cross icon. The right answer is outlined, not only coloured.
- Focus moves to **Next**. No timer.

## 3. Results
- Heading: "You scored 37 out of 50". Percentage and best streak below.
- Review list: each question with "Your answer" and "Correct answer".
- Glass action bar: **Play Again** (prominent) and **New Topic**.
- Install tip (browser mode only, after the first finished round):
  Android: "Install Trivia 50" button. iPhone: "To install, tap Share, then Add to Home Screen."

## Why this is good
Every state has words, an action and a focus target. Nothing relies on colour alone. No dead ends.
