# Decoding Open Trivia DB text safely

Sources (read 2026-11-25):
- https://opentdb.com/api_config.php (encoding types)
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
- https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

## Rules for this project
- Request `encode=url3986`. Every string field arrives percent-encoded.
- Decode every string, including each item of `incorrect_answers`, with `decodeURIComponent`.
- `decodeURIComponent` throws `URIError` on malformed input. Catch it and drop that question.
- OWASP lists `textContent` and `createTextNode` as safe sinks.
  It lists `innerHTML`, `outerHTML` and `document.write` as dangerous sinks.
  Render decoded text with `textContent` only.
