# 01 · Trivia app on Open Trivia DB

Scope: category picker, 50 random questions, answer choices, scoring, results, API limits.

Source: [Open Trivia DB API docs](https://opentdb.com/api_config.php), read 2026-11-25.
The category list below came from the live `api_category.php` endpoint on the same day.

## 1. Key facts

- The API is free. It needs no API key.
- Data is licensed **CC BY-SA 4.0**. The app must show attribution.
- One call returns **at most 50 questions**.
- One call takes **one category** only. Omit `category` for "any".
- Each IP may call the API **once every 5 seconds**.
- Session tokens stop repeat questions. They expire after **6 hours** idle.

## 2. Endpoints

| Purpose | URL |
| --- | --- |
| Questions | `https://opentdb.com/api.php?amount=50&category=9&type=multiple&encode=url3986` |
| Category list | `https://opentdb.com/api_category.php` |
| Count in one category | `https://opentdb.com/api_count.php?category=9` |
| Global count | `https://opentdb.com/api_count_global.php` |
| New session token | `https://opentdb.com/api_token.php?command=request` |
| Reset token | `https://opentdb.com/api_token.php?command=reset&token=TOKEN` |

Query parameters for `api.php`:

- `amount`: 1 to 50.
- `category`: a category ID (see below).
- `difficulty`: `easy`, `medium` or `hard`.
- `type`: `multiple` or `boolean`.
- `encode`: `urlLegacy`, `url3986` or `base64`. Default is HTML entities.
- `token`: a session token.

## 3. Categories (live list, 24 items)

| ID | Name | ID | Name |
| --- | --- | --- | --- |
| 9 | General Knowledge | 21 | Sports |
| 10 | Entertainment: Books | 22 | Geography |
| 11 | Entertainment: Film | 23 | History |
| 12 | Entertainment: Music | 24 | Politics |
| 13 | Entertainment: Musicals & Theatres | 25 | Art |
| 14 | Entertainment: Television | 26 | Celebrities |
| 15 | Entertainment: Video Games | 27 | Animals |
| 16 | Entertainment: Board Games | 28 | Vehicles |
| 17 | Science & Nature | 29 | Entertainment: Comics |
| 18 | Science: Computers | 30 | Science: Gadgets |
| 19 | Science: Mathematics | 31 | Entertainment: Japanese Anime & Manga |
| 20 | Mythology | 32 | Entertainment: Cartoon & Animations |

Fetch this list at runtime. Cache it in the service worker. Keep the table above as a fallback.

## 4. Response codes

Every response has a `response_code`. Handle each one.

| Code | Meaning | App action |
| --- | --- | --- |
| 0 | Success | Start the quiz. |
| 1 | No results. Not enough questions for the query. | See section 6. |
| 2 | Invalid parameter | Bug. Log it and show a generic error. |
| 3 | Token not found | Request a new token. Retry once. |
| 4 | Token empty. All questions used. | Reset the token. Retry once. |
| 5 | Rate limit | Wait at least 5 seconds. Retry. |

## 5. Question shape

Each item in `results` has these fields:

```json
{
  "type": "multiple",
  "difficulty": "medium",
  "category": "General Knowledge",
  "question": "...",
  "correct_answer": "...",
  "incorrect_answers": ["...", "...", "..."]
}
```

`boolean` questions have one incorrect answer. Their answers are `"True"` and `"False"`.

### Decoding text

The default encoding is HTML entities, such as `&quot;` and `&#039;`.
Do not put that text into `innerHTML`. That is an XSS risk.

Use `encode=url3986` instead. Decode each string with `decodeURIComponent`.
Then render it with `textContent`.

Avoid `base64` with plain `atob`. It breaks non-ASCII text.
If you must use base64, decode bytes with `TextDecoder`.

## 6. Getting 50 questions

The user wants 50 questions per round. Some categories cannot supply 50 for a given filter.
The API then returns code 1 and no questions.

Recommended flow:

1. Request `amount=50` with the chosen category and token.
2. On code 1, call `api_count.php?category=ID`.
3. Read the count for the chosen difficulty, or the total.
4. Retry with `amount = min(50, count)`.
5. Tell the user: "This topic has only N questions."

Wait 5 seconds between API calls. Treat the count endpoint as rate limited too.

A token also lowers the pool over time. On code 4, reset the token and retry.

## 7. Answer choices

- Build the list: `[correct_answer, ...incorrect_answers]`.
- Shuffle with Fisher–Yates. Do not use `sort(() => Math.random() - 0.5)`. It is biased.
- For `boolean`, keep a fixed order: True, then False.
- Store the correct answer index per question in app state.
- Never trust the DOM for the correct answer.

```js
function shuffle(items) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

## 8. Scoring and results

Simple default:

- One point per correct answer.
- Score shown as "17 / 50" and as a percentage.
- Track a current streak and a best streak.

Optional weights: easy 1, medium 2, hard 3. Keep this off by default. It confuses players.

Results screen:

- Final score and percentage.
- Score by difficulty.
- A review list. Show each question, the user's answer and the correct answer.
- Buttons: "Play again (same topic)" and "Pick a new topic".

Persist history in `localStorage` or IndexedDB. Store small records only:

```json
{ "categoryId": 9, "score": 37, "total": 50, "date": "2026-11-25T12:00:00Z" }
```

Show a best score per category on the topic screen.
Wrap storage calls in `try/catch`. Private mode can block them.

## 9. Rate limit and architecture choice

The 5-second limit is **per IP**. This matters for where you call the API.

- **Browser calls the API directly.** Each player uses their own IP. Limits rarely collide. This is the recommended default.
- **A Netlify Function proxies the API.** All players share a few function IPs. They will hit code 5 often. Avoid this path for live play.

Open question: confirm OpenTDB sends CORS headers. Many browser apps call it directly.
Check this in the first spike. If CORS fails, use a function with a short cache in Netlify Blobs.

Client rules:

- Keep one request in flight at a time.
- Enforce a 5-second gap in code before any retry.
- Show a "Loading questions…" state with a cancel button.

## 10. Offline behaviour

New questions need the network. Plan for that:

- The app shell loads offline from the service worker.
- The topic screen shows "You are offline" when `navigator.onLine` is false.
- Optional: pre-fetch one round per favourite topic. Store it in IndexedDB.

## 11. Suggested module layout

```
src/
  api/opentdb.ts      fetch, decode, retries, token handling
  quiz/shuffle.ts     Fisher–Yates
  quiz/state.ts       current question, answers, score, streak
  quiz/storage.ts     history and best scores
  ui/topic.ts         category picker
  ui/question.ts      one question view
  ui/results.ts       results and review
```

Keep `api`, `quiz` and `ui` separate. It makes unit tests easy.

## 12. Attribution text

Show this in the footer or an About screen:

> Questions from the Open Trivia Database (opentdb.com), licensed CC BY-SA 4.0.
