# OWASP: Secrets Management

Source: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html (read 2026-11-25)

- Apply least privilege. Give fine-grained access to each secret.
- Automate rotation where possible. Create secrets that expire after a defined time.
- Never hardcode secrets in code or config files.
- Detect secrets early: in the IDE, in pre-commit hooks and in CI.
- Audit who used a secret, when, and any authentication errors.
- Environment variables are "generally accessible to all processes and may be included in logs or system dumps."
  OWASP prefers a secrets manager. On Netlify, env vars scoped to Functions are our only option, so:
  never log them, never return them, and keep the set small.
