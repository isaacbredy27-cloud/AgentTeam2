// POST /api/chat — stream one chat turn with an agent. super_admin only.
import type { Config } from "@netlify/functions";
import { checkPost, fail, readJson, SECURITY_HEADERS } from "../lib/http.ts";
import { requireSuperAdmin } from "../lib/auth.ts";
import { findAgent } from "../lib/agents.ts";
import { chatStream, checkChatInput, MAX_BODY_BYTES } from "../lib/chat.ts";
import { authConfig, realDeps, type Deps } from "../lib/deps.ts";

export const makeHandler = (deps: Deps) => async (req: Request): Promise<Response> => {
  const auth = await requireSuperAdmin(req, authConfig(deps));
  if (!auth.ok) return auth.response;
  const bad = checkPost(req);
  if (bad) return bad;
  let body: unknown;
  try { body = await readJson(req, MAX_BODY_BYTES); } catch { return fail(413, "This chat is too long. Start a new chat."); }
  const input = checkChatInput(body);
  if (typeof input === "string") return fail(400, input);
  const agent = await findAgent(deps.root, input.agent);
  if (!agent) return fail(404, "No agent with that name.");
  return new Response(chatStream(deps, agent, input, auth.user.email || auth.user.id), {
    status: 200,
    headers: { ...SECURITY_HEADERS, "Content-Type": "text/event-stream; charset=utf-8" },
  });
};

export default makeHandler(realDeps());
export const config: Config = {
  path: "/api/chat",
  method: "POST",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
