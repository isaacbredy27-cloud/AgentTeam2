// Checks the confirm dialog: modal, Cancel on the leading side, default on the trailing side,
// Escape cancels, focus returns, and axe finds no WCAG A/AA issues.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("approve confirmation follows HIG alert rules and stays accessible", async () => {
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext()).newPage(); // axe needs a page from newContext()
    await page.goto(new URL("./approve-dialog.html", import.meta.url).href);
    await page.getByRole("button", { name: "Approve" }).click();

    const dialog = page.getByRole("dialog", { name: "Commit 3 files to main?" });
    assert.equal(await dialog.isVisible(), true);
    const labels = await dialog.getByRole("button").allTextContents();
    assert.deepEqual(labels, ["Cancel", "Commit 3 Files"]); // Cancel leading, default trailing
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Commit 3 Files");

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    assert.deepEqual(axe.violations.map((v) => v.id), []);

    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#result").textContent(), "Not committed.");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "approve");
  } finally {
    await browser.close();
  }
});
