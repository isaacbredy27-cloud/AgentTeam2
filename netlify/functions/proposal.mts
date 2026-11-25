// GET /api/proposals/:id — read one proposal and its diff. super_admin only.
import type { Config, Context } from "@netlify/functions";
import { fail, json, routeId } from "../lib/http.ts";
import { requireSuperAdmin } from "../lib/auth.ts";
import { authConfig, realDeps, type Deps } from "../lib/deps.ts";

export const makeHandler = (deps: Deps) => async (req: Request, context?: Context): Promise<Response> => {
  const auth = await requireSuperAdmin(req, authConfig(deps));
  if (!auth.ok) return auth.response;
  const id = routeId(req, context);
  if (!id) return fail(404, "No proposal with that ID.");
  const got = await (await deps.proposals()).getWithMetadata(id, { type: "json" });
  return got ? json(200, { proposal: got.data }) : fail(404, "No proposal with that ID.");
};

export default makeHandler(realDeps());
export const config: Config = { path: "/api/proposals/:id", method: "GET" };
