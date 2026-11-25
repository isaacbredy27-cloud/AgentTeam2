// GET /api/config — public Supabase settings for the browser (decision 0006).
// The anon key is a public value. No secret is ever returned here.
import type { Config } from "@netlify/functions";
import { json } from "../lib/http.ts";
import { realDeps, type Deps } from "../lib/deps.ts";

export const makeHandler = (deps: Deps) => async (): Promise<Response> => {
  const supabaseUrl = deps.env("SUPABASE_URL") ?? "";
  const supabaseAnonKey = deps.env("SUPABASE_ANON_KEY") ?? "";
  return json(200, { supabaseUrl, supabaseAnonKey, authReady: Boolean(supabaseUrl && supabaseAnonKey) });
};

export default makeHandler(realDeps());
export const config: Config = { path: "/api/config", method: "GET" };
