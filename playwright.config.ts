import { defineConfig, devices } from '@playwright/test';

// Acceptance tests drive a real browser against the real frontend. Two modes:
//
//   stub (default) — the frontend only; API calls are fulfilled from fixtures.
//                    Fast, needs no database, runs on any checkout.
//   live           — a real backend on 3001 over a seeded database.
//                    E2E_MODE=live npm run test:e2e
//
// The backend port stays 3001 because NEXT_PUBLIC_API_URL is inlined at build
// time and that is the value the code already falls back to, so nothing needs
// rebuilding to run these.

const LIVE = process.env.E2E_MODE === 'live';
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './test/e2e/specs',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: BASE_URL,
    // framer-motion elements start at opacity 0; without this, visibility
    // assertions race the animation.
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    // Stubbed specs. In live mode these are skipped: they route the API away,
    // which would defeat the point of running against a real backend.
    {
      name: 'guest',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: LIVE ? /.*/ : /-live\.spec\.ts|auth\.setup\.ts/,
    },
    ...(LIVE
      ? [
          { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
          {
            name: 'student',
            use: { ...devices['Desktop Chrome'], storageState: 'test/e2e/.auth/student.json' },
            dependencies: ['setup'],
            testMatch: /student-live\.spec\.ts/,
          },
          {
            name: 'admin',
            use: { ...devices['Desktop Chrome'], storageState: 'test/e2e/.auth/admin.json' },
            dependencies: ['setup'],
            testMatch: /admin-live\.spec\.ts/,
          },
        ]
      : []),
  ],

  webServer: [
    {
      command: `npm run dev -- --port ${PORT}`,
      url: BASE_URL,
      env: {
        NEXT_PUBLIC_API_URL: 'http://127.0.0.1:3001/api',
        // A port nothing listens on, so the chat socket fails fast instead of
        // retrying five times with backoff during every test.
        NEXT_PUBLIC_AI_WS_URL: 'ws://127.0.0.1:9/blackhole',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'ignore',
    },
    ...(LIVE
      ? [{
          command: 'npm --prefix ../ut-taiwan-be run start',
          url: 'http://127.0.0.1:3001/api/health',
          env: { PORT: '3001', NODE_ENV: 'test' },
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        }]
      : []),
  ],
});
