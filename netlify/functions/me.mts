// GET /api/me — who is signed in, and are they a super_admin?
import type { Config } from "@netlify/functions";
import { json } from "../lib/http.ts";
import { authenticate } from "../lib/auth.ts";
import { authConfig, realDeps, type Deps } from "../lib/deps.ts";

export const makeHandler = (deps: Deps) => async (req: Request): Promise<Response> => {
  const auth = await authenticate(req, authConfig(deps));
  if (!auth.ok) return auth.response;
  const { email, superAdmin } = auth.user;
  return json(superAdmin ? 200 : 403, { email, superAdmin, ...(superAdmin ? {} : { error: "This page is for admins only." }) });
};

export default makeHandler(realDeps());
export const config: Config = { path: "/api/me", method: "GET" };
