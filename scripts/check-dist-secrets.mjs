// Fail the build check if anything secret-looking reached dist/. Owner: Hollis (doc 05 §9).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const PATTERNS = [
  [/sk-ant-[A-Za-z0-9_-]{10,}/, "Anthropic key"],
  [/gh[pousr]_[A-Za-z0-9]{20,}/, "GitHub token"],
  [/github_pat_[A-Za-z0-9_]{20,}/, "GitHub fine-grained token"],
  [/service_role/, "Supabase service role"],
  // Names are fine in docs pages, but must never appear in client code.
  [/ANTHROPIC_API_KEY|GITHUB_TOKEN|SUPABASE_SERVICE_ROLE/, "secret env var name", /\.js$/],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
];
let bad = 0;
for (const f of walk(dist)) {
  if (!/\.(js|html|css|json|webmanifest|txt)$/.test(f)) continue;
  const text = readFileSync(f, "utf8");
  for (const [re, label, only] of PATTERNS) {
    if (only && !only.test(f)) continue;
    if (re.test(text)) { console.error(`FOUND ${label} in ${f}`); bad++; }
  }
}
if (bad) process.exit(1);
console.log("dist/ secret scan: clean");
