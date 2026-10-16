import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "PORT=4173 DB_PATH=/tmp/cuidali-e2e.sqlite node server/index.mjs",
    url: "http://127.0.0.1:4173/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
