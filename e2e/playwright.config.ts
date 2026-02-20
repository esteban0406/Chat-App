import { defineConfig, devices } from "@playwright/test";
import path from "path";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

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
    baseURL: BASE_URL,
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

  webServer: process.env.DOCKER
    ? undefined
    : [
        {
          command: "pnpm run start:test",
          cwd: path.resolve(__dirname, "../backend"),
          url: `${BACKEND_URL}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
          stdout: "pipe",
        },
        {
          command: process.env.CI
            ? "pnpm run build && pnpm run start"
            : "pnpm run dev",
          cwd: path.resolve(__dirname, "../frontend"),
          url: `${BASE_URL}/login`,
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
          stdout: "pipe",
        },
      ],
});
