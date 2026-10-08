import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    locale: "fr-FR",
    timezoneId: "Africa/Ndjamena",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "ordinateur",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "tablette",
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: [
    {
      command: "node e2e/start-api.cjs",
      url: "http://localhost:5100/api/health",
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: "node e2e/start-web.cjs",
      url: "http://localhost:3100/login",
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
