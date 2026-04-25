import { defineConfig, devices } from "@playwright/test";

const COMPANY_URL = process.env.COMPANY_PORTAL_URL ?? "http://localhost:3000";
const BANK_URL = process.env.BANK_PORTAL_URL ?? "http://localhost:3001";
const API_URL = process.env.PLATFORM_API_URL ?? "http://localhost:4000/health";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "npm run dev:api",
      url: API_URL,
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: "npm run dev:company",
      url: `${COMPANY_URL}/login`,
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: "npm run dev:bank",
      url: `${BANK_URL}/login`,
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
});
