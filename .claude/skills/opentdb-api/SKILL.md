---
name: opentdb-api
description: "Open Trivia DB endpoints, parameters, categories, session tokens and response codes 0-5. Use when fetching or mocking trivia questions."
---

# Open Trivia DB API

No API key. Data is CC BY-SA 4.0. Show attribution in the app.

## Endpoints
- Questions: `https://opentdb.com/api.php?amount=50&category=ID&encode=url3986&token=T`
- No `type` filter. Counts from `api_count.php` include both question types,
  so a type filter can keep returning code 1 after the fallback.
- Categories: `https://opentdb.com/api_category.php`
- Count: `https://opentdb.com/api_count.php?category=ID`
- Token: `https://opentdb.com/api_token.php?command=request` / `command=reset&token=T`

## Limits
- Max 50 questions per call. One category per call.
- One call per 5 seconds per IP.
- Tokens expire after 6 hours idle.

## Response codes
| Code | Action |
| --- | --- |
| 0 | Success. |
| 1 | Not enough questions. Read the count, retry with `min(50, count)`. Tell the user. |
| 2 | Invalid parameter. Bug. Log and show a generic error. |
| 3 | Token not found. Get a new token, retry once. |
| 4 | Token empty. Reset the token, retry once. |
| 5 | Rate limited. Wait at least 5 s, retry. |

## Decision
- The browser calls the API directly. No proxy.
- If CORS fails, stop and raise it with the orchestrator. Do not add a proxy on your own.

Details: `docs/01-trivia-opentdb.md`.

---
Shared by: opentdb-integration-expert, frontend-engineer, qa-engineer. Lead: opentdb-integration-expert.
