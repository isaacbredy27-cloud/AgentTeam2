import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers.ts";

test("service worker caches the shell; offline shows the banner, cached pages and the offline page", async ({ page, context }) => {
  await page.route("https://opentdb.com/**", (r) => r.abort());
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); // now controlled by the worker
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const precached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const shell = await caches.open(keys.find((k) => k.startsWith("shell-"))!);
    return (await shell.keys()).map((r) => new URL(r.url).pathname);
  });
  expect(precached).toEqual(expect.arrayContaining(["/", "/offline.html", "/guide/", "/manifest.webmanifest", "/icons/icon-192.png"]));
  expect(precached.some((p) => p.startsWith("/agents"))).toBe(false);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Pick a topic" })).toBeVisible();
  await expect(page.locator("#offline-banner")).toBeVisible();
  await expect(page.locator("#topic-offline")).toHaveText("You're offline. New questions need a connection.");
  await expect(page.getByRole("button", { name: /General Knowledge/ })).toBeDisabled();
  await expectNoAxeViolations(page);

  await page.goto("/guide/");
  await expect(page.getByRole("heading", { level: 1, name: "Setup and deploy guide" })).toBeVisible();

  await page.goto("/agents/");
  await expect(page.getByRole("heading", { level: 1, name: "You're offline" })).toBeVisible();
  await expectNoAxeViolations(page);
  await context.setOffline(false);
});
