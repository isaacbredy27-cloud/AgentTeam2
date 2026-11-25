// Serves examples/app on localhost, installs the service worker in Chromium,
// goes offline, reloads, and checks the shell still loads. Proves sw.js works.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const TYPES: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webmanifest": "application/manifest+json",
};

test("app shell loads offline after the service worker installs", async () => {
  const root = new URL("./app/", import.meta.url);
  const server = createServer(async (req, res) => {
    const path = req.url === "/" || req.url!.startsWith("/?") ? "/index.html" : req.url!.split("?")[0];
    try {
      const body = await readFile(new URL("." + path, root));
      res.writeHead(200, { "Content-Type": TYPES[path.slice(path.lastIndexOf("."))] ?? "application/octet-stream" });
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(base + "/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    const manifest = await (await page.request.get(base + "/manifest.webmanifest")).json();
    assert.equal(manifest.display, "standalone");

    await context.setOffline(true);
    await page.reload();
    assert.equal(await page.locator("h1").textContent(), "Trivia 50");
    assert.match((await page.locator("#status").textContent())!, /offline/);
  } finally {
    await browser.close();
    server.close();
  }
});
