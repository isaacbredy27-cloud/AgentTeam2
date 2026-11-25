// After `vite build`: write the precache list and a content version into dist/sw.js. Owner: Rowan.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname;
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const skip = (rel) => rel === "sw.js" || rel.startsWith("agents/") || rel.startsWith("assets/agents-") || rel.endsWith(".map") || rel === "_headers";
const files = walk(dist).map((p) => relative(dist, p).split("\\").join("/")).filter((r) => !skip(r)).sort();

const hash = createHash("sha256");
const urls = [];
for (const rel of files) {
  hash.update(rel).update(readFileSync(join(dist, rel)));
  if (rel === "index.html") urls.push("/");
  else if (rel.endsWith("/index.html")) urls.push("/" + rel.slice(0, -"index.html".length));
  else urls.push("/" + rel);
}
const version = hash.digest("hex").slice(0, 12);
const swPath = join(dist, "sw.js");
const sw = readFileSync(swPath, "utf8")
  .replace("__SW_VERSION__", version)
  .replace("self.__PRECACHE || []", JSON.stringify(urls));
if (sw.includes("__SW_VERSION__") || sw.includes("__PRECACHE")) throw new Error("sw.js placeholders not replaced");
writeFileSync(swPath, sw);
console.log(`sw.js: version ${version}, ${urls.length} files precached`);
