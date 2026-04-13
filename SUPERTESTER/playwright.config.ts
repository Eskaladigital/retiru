import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Super tester RETIRU — E2E sobre URLs del sitemap + rutas extra.
 * Ejecutar con el servidor ya levantado (`npm run dev` o `npm run start`).
 */
export default defineConfig({
  testDir: path.join(process.cwd(), 'SUPERTESTER'),
  testMatch: 'supertester.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.SUPERTESTER_WORKERS
    ? Number(process.env.SUPERTESTER_WORKERS)
    : process.env.CI
      ? 2
      : 4,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: path.join(process.cwd(), 'SUPERTESTER', 'playwright-report'),
        open: 'never',
      },
    ],
  ],
  use: {
    baseURL: process.env.SUPERTESTER_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: true,
    ...devices['Desktop Chrome'],
  },
  outputDir: path.join(process.cwd(), 'SUPERTESTER', 'test-results'),
});
