import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  timeout: 60000,
  expect: { timeout: 10000 },
  outputDir: "./test-results",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  globalSetup: "./global-setup.ts",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "pnpm run start:test",
      cwd: path.resolve(__dirname, "../backend"),
      url: "http://localhost:4000/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
    },
    {
      command: process.env.CI
        ? "pnpm run build && pnpm run start"
        : "pnpm run dev",
      cwd: path.resolve(__dirname, "../frontend"),
      url: "http://localhost:3000/login",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
    },
  ],
});
