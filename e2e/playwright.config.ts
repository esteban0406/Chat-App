import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../backend/.env.test') });

const webServers = process.env.CI
  ? [
      {
        command: `DATABASE_URL='${process.env.DATABASE_URL}' JWT_SECRET=testsecret npm run start:dev`,
        cwd: path.resolve(__dirname, '../backend'),
        url: 'http://localhost:4000/api',
        reuseExistingServer: false,
        timeout: 60000,
      },
      {
        command: 'npm run dev',
        cwd: path.resolve(__dirname, '../frontend'),
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 60000,
      },
    ]
  : [];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 30000,
  expect: { timeout: 5000 },
  outputDir: './test-results',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  globalSetup: './global-setup.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* In CI, webServer auto-starts both backend and frontend.
     Locally, start them manually:
       cd backend && DATABASE_URL='...' JWT_SECRET=testsecret npm run start:dev
       cd frontend && npm run dev
  */
  ...(webServers.length > 0 ? { webServer: webServers } : {}),
});
