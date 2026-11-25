---
name: safe-text-rendering
description: "Decode Open Trivia DB text and render outside text without XSS. Use when showing questions, answers or agent output."
---

# Safe text decoding and rendering

- Request `encode=url3986`. Decode each string with `decodeURIComponent`.
- Render with `textContent` or `createTextNode`. Never `innerHTML` with outside data.
- Avoid `encode=base64` with plain `atob`. It breaks non-ASCII text. Use `TextDecoder` if needed.
- Agent output in the console is untrusted. Render as text or through a sanitising Markdown renderer.
- Test with quotes, `&`, `<script>`, `π` and emoji.

---
Shared by: opentdb-integration-expert, frontend-engineer, security-expert. Lead: opentdb-integration-expert.
