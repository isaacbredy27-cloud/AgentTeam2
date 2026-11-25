// Checks the manifest against MDN's Chromium installability list.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const m = JSON.parse(readFileSync(new URL("./app/manifest.webmanifest", import.meta.url), "utf8"));

test("meets the MDN install criteria", () => {
  assert.ok(m.name || m.short_name);
  const sizes = m.icons.map((i: any) => i.sizes);
  assert.ok(sizes.includes("192x192") && sizes.includes("512x512"));
  assert.ok(m.start_url);
  assert.ok(m.display || m.display_override);
  assert.notEqual(m.prefer_related_applications, true);
});

test("project choices: stable id, standalone, one maskable icon", () => {
  assert.equal(m.id, "/");
  assert.equal(m.display, "standalone");
  assert.equal(m.icons.filter((i: any) => i.purpose === "maskable").length, 1);
});
