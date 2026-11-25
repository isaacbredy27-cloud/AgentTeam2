# OWASP: Password Storage

Source: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html (read 2026-11-25)

Recommended parameters (equal strength options):
- **Argon2id**: m=19456 (19 MiB), t=2, p=1 — and other listed trade-offs such as m=47104, t=1, p=1.
- **scrypt**: N=2^17 (128 MiB), r=8, p=1 — or N=2^16, r=8, p=2; N=2^15, r=8, p=3; N=2^14, r=8, p=5; N=2^13, r=8, p=10.
- **bcrypt**: work factor 10 or more.
- **PBKDF2-HMAC-SHA256**: 600,000 iterations.

Other points:
- Use a unique salt per password.
- A pepper is optional. It is a shared secret kept apart from the hashes, for example as an HMAC key.

## How we apply it
- Node's built-in `crypto.scrypt` with N=2^17, r=8, p=1, a 16-byte random salt and a 64-byte key.
- Node's default `maxmem` is 32 MiB. N=2^17 with r=8 needs 128 MiB, so pass `maxmem: 256 * 1024 * 1024`.
- Netlify functions have 1024 MB of memory, so this fits.
- Compare with `crypto.timingSafeEqual` (Node docs), never `===`.
