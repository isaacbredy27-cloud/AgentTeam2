// Supabase Auth check for console functions (decision 0006).
// The token is verified by Supabase itself (GET /auth/v1/user), which checks
// signature, expiry and sign-out. The role comes only from app_metadata.
import { fail } from "./http.ts";

export const SUPER_ADMIN = "super_admin";

export type AuthUser = { id: string; email: string; role: string | null; superAdmin: boolean };
export type AuthConfig = { fetch: typeof fetch; supabaseUrl?: string; supabaseAnonKey?: string };
export type AuthResult = { ok: true; user: AuthUser } | { ok: false; response: Response };

const TOKEN_RE = /^[A-Za-z0-9._-]{10,4096}$/;

export function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer (\S+)$/.exec(h);
  return m && TOKEN_RE.test(m[1]) ? m[1] : null;
}

export async function authenticate(req: Request, cfg: AuthConfig): Promise<AuthResult> {
  const token = bearerToken(req);
  if (!token) return { ok: false, response: fail(401, "Sign in first.") };
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    return { ok: false, response: fail(503, "Sign-in is not set up yet.") };
  }
  let res: Response;
  try {
    res = await cfg.fetch(`${cfg.supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { ok: false, response: fail(503, "Sign-in service is not reachable. Try again soon.") };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, response: fail(401, "Your session ended. Sign in again.") };
  }
  if (!res.ok) return { ok: false, response: fail(503, "Sign-in service is not reachable. Try again soon.") };
  let body: any;
  try { body = await res.json(); } catch { return { ok: false, response: fail(503, "Sign-in check failed.") }; }
  if (!body || typeof body.id !== "string") return { ok: false, response: fail(401, "Sign in first.") };
  // Only app_metadata is trusted. user_metadata is editable by the user and is ignored.
  const role = typeof body.app_metadata?.role === "string" ? body.app_metadata.role : null;
  return {
    ok: true,
    user: { id: body.id, email: typeof body.email === "string" ? body.email : "", role, superAdmin: role === SUPER_ADMIN },
  };
}

export async function requireSuperAdmin(req: Request, cfg: AuthConfig): Promise<AuthResult> {
  const r = await authenticate(req, cfg);
  if (!r.ok) return r;
  if (!r.user.superAdmin) return { ok: false, response: fail(403, "This page is for admins only.") };
  return r;
}
