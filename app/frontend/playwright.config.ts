import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Mobile viewport so m-only shells are visible (app is mobile-first)
    viewport: { width: 390, height: 844 },
  },
  reporter: [
    ['list'],
    ['json', { outputFile: '../../frontend-PRD/test-results/results.json' }],
    ['html', { outputFolder: '../../frontend-PRD/test-results/html', open: 'never' }],
  ],
});
