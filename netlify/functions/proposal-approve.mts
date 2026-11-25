// POST /api/proposals/:id/approve — one commit to main after a human click. super_admin only.
import type { Config, Context } from "@netlify/functions";
import { checkPost, fail, json, readJson, routeId } from "../lib/http.ts";
import { requireSuperAdmin } from "../lib/auth.ts";
import { approveProposal } from "../lib/proposals.ts";
import { audit, authConfig, gitHubConfig, realDeps, type Deps } from "../lib/deps.ts";

export const makeHandler = (deps: Deps) => async (req: Request, context?: Context): Promise<Response> => {
  const auth = await requireSuperAdmin(req, authConfig(deps));
  if (!auth.ok) return auth.response;
  const bad = checkPost(req);
  if (bad) return bad;
  const id = routeId(req, context);
  if (!id) return fail(404, "No proposal with that ID.");
  let body: any;
  try { body = await readJson(req, 1024); } catch { return fail(400, "Send { \"confirm\": true }."); }
  if (body?.confirm !== true) return fail(400, "Confirm the commit first.");
  const user = auth.user.email || auth.user.id;
  const r = await approveProposal(gitHubConfig(deps), await deps.proposals(), id, { user, now: deps.now() });
  if (r.status === 200) {
    await audit(deps, "approve", { id, user, agent: r.proposal.agent, commit: r.proposal.commitSha, files: r.proposal.files.map((f) => f.path) });
    return json(200, { proposal: r.proposal });
  }
  if (r.proposal?.status === "stale") await audit(deps, "stale", { id, user, files: r.proposal.staleFiles });
  return json(r.status, { error: r.error, proposal: r.proposal });
};

export default makeHandler(realDeps());
export const config: Config = {
  path: "/api/proposals/:id/approve",
  method: "POST",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
