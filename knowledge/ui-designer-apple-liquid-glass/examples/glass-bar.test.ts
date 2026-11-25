// Renders the glass bar in Chromium and checks the reduced-transparency fallback and target sizes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

test("glass blurs by default and turns solid when transparency is reduced", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(new URL("./glass-bar.html", import.meta.url).href);
    const backdrop = () => page.$eval(".bar", (el) => getComputedStyle(el).backdropFilter);
    assert.match(await backdrop(), /blur\(20px\)/);

    const box = await page.getByRole("button", { name: "Play Again" }).boundingBox();
    assert.ok(box && box.height >= 44, "target at least 44 px tall");

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "reduce" }] });
    assert.equal(await backdrop(), "none");
  } finally {
    await browser.close();
  }
});
