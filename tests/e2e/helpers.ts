import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const enc = encodeURIComponent;
export const CATEGORIES = { trivia_categories: [{ id: 9, name: "General Knowledge" }, { id: 30, name: "Science: Gadgets" }, { id: 22, name: "Geography" }] };

/** 50 questions: every 5th one is True/False. The correct answer is always "Right N" or "True". */
export function questions(n = 50) {
  return Array.from({ length: n }, (_, i) => {
    const boolean = i % 5 === 4;
    return {
      type: boolean ? "boolean" : "multiple",
      difficulty: ["easy", "medium", "hard"][i % 3],
      category: enc("General Knowledge"),
      question: enc(`Question ${i + 1}: what is "${i + 1}" & more?`),
      correct_answer: enc(boolean ? "True" : `Right ${i + 1}`),
      incorrect_answers: boolean ? ["False"] : [`Wrong A${i + 1}`, `Wrong B${i + 1}`, `Wrong C${i + 1}`].map(enc),
    };
  });
}

export type OpenTdbPlan = { api?: any[]; count?: any };
/** Mock every Open Trivia DB endpoint. Returns the list of requested URLs. */
export async function mockOpenTdb(page: Page, plan: OpenTdbPlan = {}) {
  const urls: string[] = [];
  const api = plan.api ?? [{ response_code: 0, results: questions() }];
  await page.route("https://opentdb.com/**", async (route) => {
    const url = route.request().url();
    urls.push(url);
    let body: any;
    if (url.includes("api_category.php")) body = CATEGORIES;
    else if (url.includes("api_token.php")) body = { response_code: 0, token: "E2ETOKEN" };
    else if (url.includes("api_count.php")) body = plan.count;
    else body = api.length > 1 ? api.shift() : api[0];
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) });
  });
  return urls;
}

export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/agents/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

/** The Supabase access token the page holds (supabase-js keeps it in localStorage). */
export async function pageToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))!;
    return JSON.parse(localStorage.getItem(key)!).access_token as string;
  });
}
