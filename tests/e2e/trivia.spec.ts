import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalScroll, mockOpenTdb, questions } from "./helpers.ts";

test.use({ serviceWorkers: "block" });

test("full 50-question round, results, review and score history", async ({ page }) => {
  const urls = await mockOpenTdb(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Pick a topic" })).toBeVisible();
  await expect(page.getByText("No scores yet. Pick a topic to play your first round.")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: /General Knowledge/ }).click();
  await expect(page.getByText("Question 1 of 50")).toBeVisible({ timeout: 15_000 });
  const apiUrl = urls.find((u) => u.includes("api.php"))!;
  expect(apiUrl).toContain("amount=50");
  expect(apiUrl).toContain("category=9");
  expect(apiUrl).toContain("encode=url3986");
  expect(apiUrl).not.toContain("type=");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText('Question 1: what is "1" & more?');
  await expectNoAxeViolations(page);

  // Answer: correct on even questions, wrong on odd ones.
  let expected = 0;
  for (let i = 0; i < 50; i++) {
    const n = i + 1;
    const boolean = i % 5 === 4;
    const answers = page.locator(".answers .answer");
    if (boolean) await expect(answers).toHaveText(["True", "False"]); // fixed order
    else await expect(answers).toHaveCount(4);
    const right = i % 2 === 0;
    if (right) expected++;
    const pick = boolean ? (right ? "True" : "False") : right ? `Right ${n}` : `Wrong A${n}`;
    await answers.filter({ hasText: new RegExp(`^${pick}$`) }).first().click();
    await expect(page.locator(".feedback")).toHaveText(right ? "✓ Correct." : `✗ Wrong. The answer is ${boolean ? "True" : `Right ${n}`}.`);
    if (i === 0) {
      await expect(page.getByRole("button", { name: "Next Question" })).toBeFocused();
      await expectNoAxeViolations(page);
    }
    if (i === 1) await expect(page.getByText("Streak 0")).toBeVisible();
    await page.locator("#next-btn").click();
  }

  await expect(page.getByRole("heading", { level: 1, name: "Round complete" })).toBeVisible();
  await expect(page.locator(".score-big")).toHaveText(`${expected} / 50`);
  await expect(page.getByText(`${Math.round((expected * 100) / 50)}% correct · Best streak 1`)).toBeVisible();
  await expect(page.locator(".review-item")).toHaveCount(50);
  await expect(page.locator(".review-item").nth(1)).toContainText("Correct answer: Right 2");
  await expectNoHorizontalScroll(page);
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Pick a New Topic" }).click();
  await expect(page.getByRole("button", { name: /General Knowledge Best 25 \/ 50/ })).toBeVisible();
  await expect(page.locator(".history-item")).toHaveCount(1);
});

test("shorter topic: falls back to the count endpoint and explains the shorter round", async ({ page }) => {
  test.setTimeout(60_000);
  const urls = await mockOpenTdb(page, {
    api: [{ response_code: 1, results: [] }, { response_code: 0, results: questions(40) }],
    count: { category_id: 30, category_question_count: { total_question_count: 40 } },
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Science: Gadgets/ }).click();
  await expect(page.getByText("Question 1 of 40")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("This topic has only 40 questions, so this round is shorter.")).toBeVisible();
  expect(urls.filter((u) => u.includes("api.php?amount=40"))).toHaveLength(1);
});

test("rate limit (code 5): waits and retries, then plays", async ({ page }) => {
  const urls = await mockOpenTdb(page, { api: [{ response_code: 5 }, { response_code: 0, results: questions(10) }] });
  await page.goto("/");
  await page.getByRole("button", { name: /Geography/ }).click();
  await expect(page.getByText("Getting questions… this can take a few seconds.")).toBeVisible();
  await expect(page.getByText("Question 1 of 10")).toBeVisible({ timeout: 20_000 });
  expect(urls.filter((u) => u.includes("api.php"))).toHaveLength(2);
});

test("network failure shows a plain error with Try Again", async ({ page }) => {
  await page.route("https://opentdb.com/**", (r) => (r.request().url().includes("api_category") ? r.fulfill({ json: { trivia_categories: [{ id: 9, name: "General Knowledge" }] }, headers: { "Access-Control-Allow-Origin": "*" } }) : r.abort()));
  await page.goto("/");
  await page.getByRole("button", { name: /General Knowledge/ }).click();
  await expect(page.getByRole("alert")).toHaveText("Couldn't get questions. Check your connection and try again.", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("static pages: phone layout, links and accessibility", async ({ page }) => {
  for (const [path, title] of [["/how-it-works/", "How it works"], ["/resources/", "Resources"], ["/guide/", "Setup and deploy guide"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["Play", "How it works", "Resources", "Guide", "Agents"]) await expect(nav.getByRole("link", { name: label })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page);
  }
  await page.goto("/resources/");
  for (const href of ["https://github.com/isaacbredy27-cloud/AgentTeam2", "https://mcp-api.netlify.app/", "/guide/", "https://opentdb.com/api_config.php"]) {
    await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(1);
  }
});

test("manifest is served with the right type and fields", async ({ request }) => {
  const r = await request.get("/manifest.webmanifest");
  expect(r.headers()["content-type"]).toContain("application/manifest+json");
  const m = await r.json();
  expect(m.icons.map((i: any) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  for (const icon of m.icons) expect((await request.get(icon.src)).status()).toBe(200);
});
