import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:4173", trace: "off" },
  webServer: {
    command: "node ../../tools/serve.mjs fixture 4173",
    cwd: new URL(".", import.meta.url).pathname,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  projects: [
    { name: "iPhone 15", use: { ...devices["iPhone 15"] } }, // WebKit: install it in CI
    { name: "Pixel 7", use: { ...devices["Pixel 7"] } },     // Chromium
  ],
});
