import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const enc = encodeURIComponent;
const fixture = {
  response_code: 0,
  results: [{
    type: "multiple", difficulty: "easy", category: enc("General Knowledge"),
    question: enc(`Which "planet" is known as the Red Planet? <b>π</b>`),
    correct_answer: "Mars", incorrect_answers: ["Venus", "Jupiter", "Saturn"],
  }],
};

test.beforeEach(async ({ page }) => {
  // Mock Open Trivia DB before navigating. CORS still applies to fulfilled cross-origin responses.
  await page.route("https://opentdb.com/**", (route) =>
    route.fulfill({ json: fixture, headers: { "access-control-allow-origin": "*" } }));
});

test("shows the decoded question as text and gives accessible feedback", async ({ page }) => {
  await page.goto("/");
  const legend = page.locator("legend");
  await expect(legend).toHaveText(`Which "planet" is known as the Red Planet? <b>π</b>`);
  await expect(page.locator("legend b")).toHaveCount(0); // markup was not injected

  await page.getByRole("button", { name: "Venus" }).click();
  await expect(page.locator("#feedback")).toHaveText("Wrong. The answer is Mars.");
  await expect(page.locator("#feedback")).toHaveAttribute("aria-live", "polite");
});

test("has no automatically detectable WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Mars" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
