// Console password hashing (OWASP scrypt params) and signed session cookies.
import { scrypt, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }; // OWASP: N=2^17, r=8, p=1

// Stored format: scrypt$<salt b64>$<hash b64>. Put it in CONSOLE_PASSWORD_HASH.
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(pw, salt, 64, PARAMS);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(pw, Buffer.from(saltB64, "base64"), expected.length, PARAMS);
  return timingSafeEqual(actual, expected);
}

// Session cookie value: <id>.<hmac>. The id is also stored server-side so logout can revoke it.
export function newSessionId(): string {
  return randomBytes(32).toString("base64url"); // 256 bits, above OWASP's 64-bit minimum
}

export function signSession(id: string, secret: string): string {
  return `${id}.${createHmac("sha256", secret).update(id).digest("base64url")}`;
}

export function verifySession(value: string, secret: string): string | null {
  const [id, mac] = value.split(".");
  if (!id || !mac) return null;
  const good = Buffer.from(createHmac("sha256", secret).update(id).digest("base64url"));
  const got = Buffer.from(mac);
  return got.length === good.length && timingSafeEqual(got, good) ? id : null;
}

export const sessionCookie = (value: string) =>
  `session=${value}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800`;

// CSRF gate for every console POST.
export function csrfOk(req: Request, siteOrigin: string): boolean {
  if (req.headers.get("x-console") !== "1") return false;
  if (req.headers.get("origin") !== siteOrigin) return false;
  return req.headers.get("sec-fetch-site") !== "cross-site";
}
