# MDN: localStorage

Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (read 2026-11-25)

- Stores data per **origin**, kept across browser sessions.
- Keys and values are UTF-16 strings. Store JSON with `JSON.stringify` / `JSON.parse`.
- Throws `SecurityError` when the origin is not a valid tuple (e.g. `file:` or `data:`) or when the user blocks site data.
  "If the user blocks cookies, browsers will probably interpret this as an instruction to prevent the page from persisting data."
- In private browsing, data "is cleared when the last 'private' tab is closed."
- API: `setItem`, `getItem`, `removeItem`, `clear`.

## Our rule
Wrap every call in try/catch. A failure means "no history", never a crash.
