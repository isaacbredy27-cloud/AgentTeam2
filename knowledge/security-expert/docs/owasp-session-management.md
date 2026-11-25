# OWASP: Session Management

Source: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html (read 2026-11-25)

- Session IDs need at least **64 bits of entropy**. Hex-encoded, that is at least 16 characters.
  We use 32 random bytes (256 bits).
- Cookie attributes:
  - `Secure`: send only over HTTPS.
  - `HttpOnly`: scripts cannot read the cookie through `document.cookie`.
  - `SameSite`: set `Strict` (preferred) or `Lax` explicitly. Never `None` without `Secure`. Do not rely on browser defaults.
  - `Domain`: do not set it. The cookie stays on the origin server.
  - `Path`: as narrow as possible. We use `Path=/api`.
  - `Max-Age` or `Expires` makes the cookie persistent until that time.
- Timeouts: idle timeouts of "2-5 minutes for high-value applications and 15-30 minutes for low risk applications".
  Absolute timeout for a full working day: "between 4 and 8 hours".
- Renew or regenerate the session ID after any privilege change, such as login.
- On logout or expiry the server must actively invalidate the session. Clearing the cookie alone is not enough.

## How we apply it
- Console session: absolute timeout 8 hours (`Max-Age=28800`). Idle timeout 30 minutes, tracked in Blobs.
- New session ID on every login. Logout deletes the session record in Blobs.
