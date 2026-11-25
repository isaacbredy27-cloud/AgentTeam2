import { defineConfig, devices } from "@playwright/test";

const PORT = 8890;
// WebKit is not installed in this container, so the iPhone-sized project runs on Chromium.
const iphone = devices["iPhone 15"];

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "off" },
  webServer: {
    command: `node scripts/local-harness.ts`,
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/api/config`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: "Pixel 7", use: { ...devices["Pixel 7"] } },
    {
      name: "iPhone size (Chromium)",
      use: {
        browserName: "chromium",
        viewport: iphone.viewport, deviceScaleFactor: iphone.deviceScaleFactor,
        isMobile: true, hasTouch: true, userAgent: iphone.userAgent,
      },
    },
  ],
});
