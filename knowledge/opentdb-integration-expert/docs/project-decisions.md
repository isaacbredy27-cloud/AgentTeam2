# Project decisions that bind this agent

Source: this repo, `docs/decisions/` (read 2026-11-25)

- 0002: The browser calls Open Trivia DB directly. No proxy, cache or relay function.
  If CORS ever blocks browser calls, stop and hand it to the orchestrator.
- The 5-second limit is per IP. A shared server IP would rate-limit every player. That is why there is no proxy.
- A round is up to 50 questions from one category. Shorter rounds are allowed when the category is small.
