// Fake Supabase Auth: password sign-in, /user and /logout. No real project is used.
export type FakeUser = { email: string; password: string; app_metadata: Record<string, unknown>; user_metadata: Record<string, unknown> };

export const FAKE_USERS: FakeUser[] = [
  { email: "admin@example.test", password: "admin-pass", app_metadata: { provider: "email", role: "super_admin" }, user_metadata: {} },
  { email: "player@example.test", password: "player-pass", app_metadata: { provider: "email" }, user_metadata: {} },
  // Claims super_admin only in user_metadata, which users can edit. Must be refused.
  { email: "sneaky@example.test", password: "sneaky-pass", app_metadata: { provider: "email" }, user_metadata: { role: "super_admin" } },
];

const b64u = (s: string) => Buffer.from(s).toString("base64url");
const idOf = (email: string) => "00000000-0000-4000-8000-" + Buffer.from(email).toString("hex").padEnd(12, "0").slice(0, 12);

export function tokenFor(email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: idOf(email), email, role: "authenticated", aud: "authenticated", iat: now, exp: now + 3600, session_id: "s-" + idOf(email) };
  return `${b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64u(JSON.stringify(payload))}.${b64u("fake-signature-" + email)}`;
}

function userJson(u: FakeUser) {
  return {
    id: idOf(u.email), aud: "authenticated", role: "authenticated", email: u.email,
    email_confirmed_at: "2026-11-25T00:00:00Z", app_metadata: u.app_metadata, user_metadata: u.user_metadata,
    identities: [], created_at: "2026-11-25T00:00:00Z", updated_at: "2026-11-25T00:00:00Z",
  };
}

export function fakeSupabase(opts: { anonKey: string }) {
  const revoked = new Set<string>();
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

  return {
    revoked,
    /** Handle a request whose pathname starts with /auth/v1/. */
    async handle(req: Request, pathname: string): Promise<Response> {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST" } });
      if (req.headers.get("apikey") !== opts.anonKey) return json(401, { message: "Invalid API key" });
      const url = new URL(req.url);
      if (pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
        const body = await req.json().catch(() => ({}));
        const u = FAKE_USERS.find((x) => x.email === body.email && x.password === body.password);
        if (!u) return json(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
        const access_token = tokenFor(u.email);
        revoked.delete(access_token);
        return json(200, {
          access_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "refresh-" + idOf(u.email), user: userJson(u),
        });
      }
      const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
      const u = FAKE_USERS.find((x) => token && tokenFor(x.email).split(".")[2] === token.split(".")[2]);
      if (pathname === "/auth/v1/user") {
        if (!u || !token || revoked.has(token)) return json(401, { code: 401, msg: "invalid JWT" });
        return json(200, userJson(u));
      }
      if (pathname === "/auth/v1/logout") {
        if (token) revoked.add(token);
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
      }
      return json(404, { msg: "not found in fake" });
    },
  };
}
