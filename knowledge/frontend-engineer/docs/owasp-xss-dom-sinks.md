# OWASP: Cross Site Scripting prevention (DOM rules)

Source: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html (read 2026-11-25)

- **Safe sinks**: `textContent`, `insertAdjacentText`, `className`, `value`, `createTextNode`, and `setAttribute` for safe attributes.
- **Dangerous sinks**: `innerHTML`, `outerHTML`, `document.write`.
- Encode for the context: HTML, HTML attribute, JavaScript, CSS (`style.setProperty` with an allow-list), URL.
- When people must author HTML, sanitise with DOMPurify: `let clean = DOMPurify.sanitize(dirty);`
- CSP is defence in depth, not the main defence.

## Our rule
Questions, answers and agent text render with `textContent` or `createTextNode`. Never `innerHTML`.
