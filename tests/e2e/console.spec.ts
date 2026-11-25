import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalScroll, pageToken, signIn } from "./helpers.ts";

test.use({ serviceWorkers: "block" });

test("signed out: only the sign-in form shows", async ({ page, request }) => {
  await page.goto("/agents/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.locator(".agent-list")).toHaveCount(0);
  await expectNoHorizontalScroll(page);
  await expectNoAxeViolations(page);
  expect((await request.get("/api/agents")).status()).toBe(401);
});

test("wrong password shows a plain error", async ({ page }) => {
  await signIn(page, "admin@example.test", "nope");
  await expect(page.getByRole("alert")).toHaveText("That email and password didn't work. Try again.");
});

test("non-super_admin is blocked in the UI and by the server", async ({ page, request }) => {
  await signIn(page, "player@example.test", "player-pass");
  await expect(page.getByText("This page is for admins only.")).toBeVisible();
  await expect(page.locator(".agent-list")).toHaveCount(0);
  await expectNoAxeViolations(page);
  const token = await pageToken(page);
  for (const path of ["/api/agents", "/api/me"]) {
    expect((await request.get(path, { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(403);
  }
  const chat = await request.post("/api/chat", { headers: { Authorization: `Bearer ${token}` }, data: { agent: "qa-engineer", messages: [{ role: "user", content: "hi" }] } });
  expect(chat.status()).toBe(403);
});

test("user_metadata cannot grant super_admin", async ({ page }) => {
  await signIn(page, "sneaky@example.test", "sneaky-pass");
  await expect(page.getByText("This page is for admins only.")).toBeVisible();
});

test("super_admin sees every agent and chats with a streamed reply", async ({ page }) => {
  await signIn(page, "admin@example.test", "admin-pass");
  await expect(page.locator(".agent-card")).toHaveCount(12);
  const hollis = page.locator('[data-agent-card="security-expert"]');
  await expect(hollis.getByRole("heading")).toHaveText("Hollis security-expert");
  await expect(hollis.locator(".model-badge")).toHaveText("opus · claude-opus-5-5");
  await expect(hollis.locator(".personality")).toContainText("sceptical");
  await hollis.getByText(/Knowledge files \(\d+\)/).click();
  await expect(hollis.locator(".file-list li", { hasText: "examples/path-rules.ts" })).toBeVisible();
  await expect(page.locator('[data-agent-card="opentdb-integration-expert"] .model-badge')).toHaveText("haiku · claude-haiku-5-5");
  await expectNoHorizontalScroll(page);
  await expectNoAxeViolations(page);

  await hollis.getByRole("button", { name: "Chat with Hollis" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Chat with Hollis" })).toBeVisible();
  await page.getByLabel("Message to Hollis").fill("hello there");
  await page.getByRole("button", { name: "Send" }).click();
  const reply = page.locator(".msg.assistant").last();
  await expect(reply).toContainText("Hello, I'm Hollis. I run on claude-opus-5-5. You said: hello there");
  await expect(page.locator("#announcer")).toHaveText("Reply from Hollis finished.");
  await expectNoAxeViolations(page);

  // A second turn keeps the history valid (alternating roles).
  await page.getByLabel("Message to Hollis").fill("second message");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".msg.assistant").last()).toContainText("You said: second message");
  const calls = await (await page.request.get("/__fake/anthropic")).json();
  expect(calls.calls.at(-1)).toMatchObject({ model: "claude-opus-5-5", tools: ["propose_change"], messages: 3 });
});

test("approve flow: diff, confirm dialog, one commit with force false, second approve blocked", async ({ page }) => {
  const before = (await (await page.request.get("/__fake/github")).json()).commits.length;
  await signIn(page, "admin@example.test", "admin-pass");
  await page.getByRole("button", { name: "Chat with Atlas" }).click();
  await page.getByLabel("Message to Atlas").fill("please propose a change");
  await page.getByRole("button", { name: "Send" }).click();

  const card = page.locator(".proposal");
  await expect(card).toBeVisible();
  await expect(card.getByRole("heading", { level: 3 })).toHaveText("Add a console demo note");
  await expect(card.locator(".diff-line.add", { hasText: "+Updated from the console." })).toBeVisible();
  await expect(card.locator(".diff-line.del").first()).toBeVisible();
  await expect(card.locator(".diff")).toHaveCount(2);
  await expectNoHorizontalScroll(page);
  await expectNoAxeViolations(page);

  // Cancel first: nothing is committed.
  await card.getByRole("button", { name: "Approve" }).click();
  const dialog = page.getByRole("dialog", { name: "Commit 2 files to main?" });
  await expect(dialog).toBeVisible();
  await expectNoAxeViolations(page);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(card.getByRole("button", { name: "Approve" })).toBeFocused();
  expect((await (await page.request.get("/__fake/github")).json()).commits.length).toBe(before);

  // Now approve for real.
  await card.getByRole("button", { name: "Approve" }).click();
  await dialog.getByRole("button", { name: "Commit 2 Files" }).click();
  await expect(card.locator(".status-pill")).toHaveText("Approved");
  await expect(card.getByText("Committed 2 files. Deploy started.")).toBeVisible();
  await expect(card.getByRole("link", { name: "View commit" })).toHaveAttribute("href", /^https:\/\/github\.com\/isaacbredy27-cloud\/AgentTeam2\/commit\/[0-9a-f]{40}$/);
  await expect(card.getByRole("button", { name: "Approve" })).toBeHidden();

  const gh = await (await page.request.get("/__fake/github")).json();
  expect(gh.commits.length).toBe(before + 1);
  const update = gh.refUpdates.at(-1);
  expect(update.body.force).toBe(false);
  expect(update.path).toBe("/repos/isaacbredy27-cloud/AgentTeam2/git/refs/heads/main");

  // A second approve (for example a replayed request) is refused and commits nothing.
  const id = await card.getAttribute("data-proposal");
  const token = await pageToken(page);
  const again = await page.request.post(`/api/proposals/${id}/approve`, {
    headers: { Authorization: `Bearer ${token}`, Origin: new URL(page.url()).origin }, data: { confirm: true },
  });
  expect(again.status()).toBe(409);
  expect((await again.json()).error).toBe("This proposal is already approved.");
  expect((await (await page.request.get("/__fake/github")).json()).commits.length).toBe(before + 1);
});

test("stale proposal: a file changed after the proposal, so Approve commits nothing", async ({ page }) => {
  await signIn(page, "admin@example.test", "admin-pass");
  await page.getByRole("button", { name: "Chat with Kit" }).click();
  await page.getByLabel("Message to Kit").fill("propose please");
  await page.getByRole("button", { name: "Send" }).click();
  const card = page.locator(".proposal");
  await expect(card).toBeVisible();
  const before = (await (await page.request.get("/__fake/github")).json()).commits.length;
  await page.request.post("/__fake/github/touch", { data: { path: "docs/plans/README.md", content: `changed by someone else at ${Date.now()}\n` } });
  await card.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Commit 2 Files" }).click();
  await expect(card.locator(".status-pill")).toHaveText("Out of date");
  await expect(card.getByText("These files changed since the proposal. Ask the agent to redo it.")).toBeVisible();
  expect((await (await page.request.get("/__fake/github")).json()).commits.length).toBe(before);
});

test("blocked path and reject", async ({ page }) => {
  await signIn(page, "admin@example.test", "admin-pass");
  await page.getByRole("button", { name: "Chat with Nico" }).click();
  await page.getByLabel("Message to Nico").fill("bad path change");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".msg.error")).toContainText("netlify.toml: denied path.");
  await expect(page.locator(".proposal")).toHaveCount(0);

  await page.getByLabel("Message to Nico").fill("ok, propose something allowed");
  await page.getByRole("button", { name: "Send" }).click();
  const card = page.locator(".proposal");
  await card.getByRole("button", { name: "Reject" }).click();
  await expect(card.getByText("Rejected. Nothing was committed.")).toBeVisible();
});

test("sign out returns to the sign-in form", async ({ page }) => {
  await signIn(page, "admin@example.test", "admin-pass");
  await expect(page.locator(".agent-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
