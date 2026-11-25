import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hex, ratio, worstOnGlass } from "./contrast.ts";

test("formula matches the WCAG extremes", () => {
  assert.equal(ratio(hex("#000000"), hex("#ffffff")).toFixed(1), "21.0");
  assert.equal(ratio(hex("#777777"), hex("#777777")), 1);
});

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const [light, dark] = css.split("@media (prefers-color-scheme: dark)");
const tok = (block: string, name: string) => hex(block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))![1]);

for (const [mode, block] of [["light", light], ["dark", dark]] as const) {
  test(`${mode}: every text pair is at least 4.5:1`, () => {
    const pairs: [string, string][] = [
      ["color-text", "color-bg"], ["color-text", "color-surface"], ["color-text-secondary", "color-surface"],
      ["color-on-accent", "color-accent"], ["color-correct", "color-surface"], ["color-wrong", "color-surface"],
    ];
    for (const [fg, bg] of pairs) {
      const r = ratio(tok(block, fg), tok(block, bg));
      assert.ok(r >= 4.5, `${mode} ${fg} on ${bg} = ${r.toFixed(2)}`);
    }
  });
}

test("text on glass stays above 4.5:1 over a black or white backdrop (iOS ignores reduced-transparency)", () => {
  assert.ok(worstOnGlass(hex("#111318"), hex("#ffffff"), 0.72) >= 4.5); // light glass
  assert.ok(worstOnGlass(hex("#f2f4f8"), hex("#161a22"), 0.72) >= 4.5); // dark glass
  // A too-clear fill fails, which is why we do not use clear glass behind text.
  assert.ok(worstOnGlass(hex("#111318"), hex("#ffffff"), 0.2) < 4.5);
});
