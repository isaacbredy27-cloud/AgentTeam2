// POST /api/proposals/:id/reject — mark a pending proposal rejected. super_admin only.
import type { Config, Context } from "@netlify/functions";
import { checkPost, fail, json, routeId } from "../lib/http.ts";
import { requireSuperAdmin } from "../lib/auth.ts";
import { rejectProposal } from "../lib/proposals.ts";
import { audit, authConfig, realDeps, type Deps } from "../lib/deps.ts";

export const makeHandler = (deps: Deps) => async (req: Request, context?: Context): Promise<Response> => {
  const auth = await requireSuperAdmin(req, authConfig(deps));
  if (!auth.ok) return auth.response;
  const bad = checkPost(req);
  if (bad) return bad;
  const id = routeId(req, context);
  if (!id) return fail(404, "No proposal with that ID.");
  const user = auth.user.email || auth.user.id;
  const r = await rejectProposal(await deps.proposals(), id, { user, now: deps.now() });
  if (r.status === 200) await audit(deps, "reject", { id, user, agent: r.proposal.agent });
  return r.status === 200 ? json(200, { proposal: r.proposal }) : json(r.status, { error: r.error, proposal: r.proposal });
};

export default makeHandler(realDeps());
export const config: Config = { path: "/api/proposals/:id/reject", method: "POST" };
