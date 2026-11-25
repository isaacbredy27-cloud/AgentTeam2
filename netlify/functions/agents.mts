// GET /api/agents — every agent with model, personality and knowledge files. super_admin only.
import type { Config } from "@netlify/functions";
import { fail, json } from "../lib/http.ts";
import { requireSuperAdmin } from "../lib/auth.ts";
import { loadAgents, publicInfo } from "../lib/agents.ts";
import { authConfig, realDeps, type Deps } from "../lib/deps.ts";

export const makeHandler = (deps: Deps) => async (req: Request): Promise<Response> => {
  const auth = await requireSuperAdmin(req, authConfig(deps));
  if (!auth.ok) return auth.response;
  try {
    const agents = (await loadAgents(deps.root)).map(publicInfo);
    return json(200, { agents });
  } catch {
    return fail(500, "Could not read the agent files.");
  }
};

export default makeHandler(realDeps());
export const config: Config = { path: "/api/agents", method: "GET" };
