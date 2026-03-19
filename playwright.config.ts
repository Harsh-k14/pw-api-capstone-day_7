import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://dummyjson.com';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30000,
  globalSetup: './global.setup.ts',

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'reports/report.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
  ],
});
