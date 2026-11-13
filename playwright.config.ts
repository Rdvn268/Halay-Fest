import { defineConfig } from '@playwright/test';

const production = process.env['TEST_PRODUCTION'] === '1';
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'legacy', testMatch: 'legacy.spec.ts' },
    { name: 'phase-1', testMatch: 'phase1.spec.ts', use: { baseURL: `http://127.0.0.1:${production ? 4175 : 5174}` } },
  ],
  webServer: [
    { command: 'npm run dev:legacy', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env['CI'], timeout: 60_000 },
    { command: production ? 'npm start' : 'npm run dev', url: `http://127.0.0.1:${production ? 4175 : 5174}/api/health`,
      env: { DATABASE_PATH: 'data/e2e.sqlite' }, reuseExistingServer: false, timeout: 60_000 },
  ],
});
