# Open Trivia DB API reference

Source: https://opentdb.com/api_config.php (read 2026-11-25)
Category list: https://opentdb.com/api_category.php (fetched live 2026-11-25)

## Access and licence
- Free JSON API. "Use of this API does not require a API Key."
- Data is licensed CC BY-SA 4.0. Show attribution in the app.

## Endpoints
| Purpose | URL |
| --- | --- |
| Questions | `https://opentdb.com/api.php?amount=10` |
| Session token | `https://opentdb.com/api_token.php?command=request` |
| Reset token | `https://opentdb.com/api_token.php?command=reset&token=YOURTOKENHERE` |
| Category list | `https://opentdb.com/api_category.php` |
| Category count | `https://opentdb.com/api_count.php?category=CATEGORY_ID_HERE` |
| Global count | `https://opentdb.com/api_count_global.php` |

Query parameters for `api.php`: `amount`, `category`, `difficulty` (`easy`, `medium`, `hard`),
`type` (`multiple`, `boolean`), `encode` (`urlLegacy`, `url3986`, `base64`), `token`.

## Limitations (quoted)
- "Only 1 Category can be requested per API Call. To get questions from any category, don't specify a category."
- "A Maximum of 50 Questions can be retrieved per call."

## Session tokens (quoted)
- "By appending a Session Token to a API Call, the API will never give you the same question twice."
- "Session Tokens will be deleted after 6 hours of inactivity."
- When all questions are used, "you can either 'Reset' the Token ... or you can ask for a new one."

## Response codes (quoted)
- Code 0: **Success** Returned results successfully.
- Code 1: **No Results** "The API doesn't have enough questions for your query. (Ex. Asking for 50 Questions in a Category that only has 20.)"
- Code 2: **Invalid Parameter** "Arguements passed in aren't valid. (Ex. Amount = Five)"
- Code 3: **Token Not Found** "Session Token does not exist."
- Code 4: **Token Empty** "Session Token has returned all possible questions for the specified query. Resetting the Token is necessary."
- Code 5: **Rate Limit** "Too many requests have occurred. Each IP can only access the API once every 5 seconds."

## Encoding
- Default encoding is HTML codes (entities such as `&quot;`).
- `url3986` gives RFC 3986 percent-encoding. Decode with `decodeURIComponent`.
- `base64` needs a UTF-8 aware decoder. Plain `atob` breaks non-ASCII text.

## Question object (fields)
`type`, `difficulty`, `category`, `question`, `correct_answer`, `incorrect_answers` (array).
Boolean questions have one incorrect answer; answers are `"True"` and `"False"`.

## Categories (live list)
9 General Knowledge · 10 Books · 11 Film · 12 Music · 13 Musicals & Theatres · 14 Television ·
15 Video Games · 16 Board Games · 17 Science & Nature · 18 Computers · 19 Mathematics ·
20 Mythology · 21 Sports · 22 Geography · 23 History · 24 Politics · 25 Art · 26 Celebrities ·
27 Animals · 28 Vehicles · 29 Comics · 30 Gadgets · 31 Japanese Anime & Manga · 32 Cartoon & Animations.
Names 10–16, 29, 31, 32 carry the prefix "Entertainment: ". Names 18, 19, 30 carry "Science: ".

## Live checks (2026-11-25)
- `api_count.php?category=30` returned:
  `{"category_id":30,"category_question_count":{"total_question_count":40,"total_easy_question_count":17,"total_medium_question_count":17,"total_hard_question_count":6}}`
  So "Science: Gadgets" cannot fill a 50-question round.
- Counts include multiple-choice and true/false questions together.
  Filtering by `type` can make a count-based retry still fail. Do not filter by type.
- A real `encode=url3986` response is saved as `examples/fixture-category-30.json`.
  Note that `type` and `difficulty` came back unencoded. Decoding them is harmless.
