// Runs every worked example in the knowledge folders. Exit code 1 if anything fails.
import { spawnSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const here = new URL(".", import.meta.url).pathname;
const agents = readdirSync(here, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(here, d.name, "examples")))
  .map((d) => d.name);

const steps = [];
for (const a of agents) {
  const ex = join(a, "examples");
  const nodeTests = readdirSync(join(here, ex)).filter((f) => f.endsWith(".test.ts") && !f.includes(".vitest."));
  if (nodeTests.length) steps.push([`${a}: node --test`, "node", ["--test", ...nodeTests.map((f) => join(ex, f))]]);
}
steps.push(["qa-engineer: vitest", "npx", ["vitest", "run", "qa-engineer/examples/retry-wait.vitest.test.ts"]]);
steps.push(["qa-engineer: playwright (Pixel 7)", "npx",
  ["playwright", "test", "-c", "qa-engineer/examples/playwright.config.ts", "--project=Pixel 7", "--reporter=line"]]);
steps.push(["software-architect: tsc", "npx", ["tsc", "-p", "software-architect/examples/tsconfig.json"]]);
steps.push(["meta-agent: validate team", "node", ["meta-agent/examples/validate-team.mjs", ".."]]);

let failed = 0;
for (const [label, cmd, args] of steps) {
  const r = spawnSync(cmd, args, { cwd: here, encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0" } });
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) console.log((r.stdout + r.stderr).split("\n").slice(-25).join("\n"));
}
console.log(failed ? `\n${failed} step(s) failed.` : `\nAll ${steps.length} steps passed.`);
process.exit(failed ? 1 : 0);
