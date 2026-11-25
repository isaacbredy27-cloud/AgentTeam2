// netlify/functions/agents.mts — list agents. Sets its own security headers,
// because netlify.toml custom headers do not apply to function responses.
import type { Config, Context } from "@netlify/functions";

export const SECURITY_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

type Agent = { name: string; model: string; description: string };

export function makeHandler(loadAgents: () => Promise<Agent[]>, hasSession: (req: Request) => Promise<boolean>) {
  return async (req: Request, _context: Context) => {
    if (!(await hasSession(req))) {
      return new Response(JSON.stringify({ error: "Sign in first." }), { status: 401, headers: SECURITY_HEADERS });
    }
    const agents = await loadAgents();
    return new Response(JSON.stringify({ agents }), { status: 200, headers: SECURITY_HEADERS });
  };
}

export const config: Config = { path: "/api/agents", method: "GET" };
