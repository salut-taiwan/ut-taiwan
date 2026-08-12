import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const shared = {
  environment: 'jsdom' as const,
  // MSW handlers need an absolute origin, and lib/api.ts reads this at import.
  env: {
    NEXT_PUBLIC_API_URL: 'http://api.test/api',
    NEXT_PUBLIC_AI_WS_URL: 'ws://ws.test',
  },
  restoreMocks: true,
  clearMocks: true,
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': import.meta.dirname } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          ...shared,
          name: 'unit',
          setupFiles: ['./test/setup/base.ts'],
          include: ['lib/**/*.test.{ts,tsx}', 'components/**/*.test.tsx', 'hooks/**/*.test.ts'],
          exclude: ['**/node_modules/**', '.next/**'],
        },
      },
      {
        extends: true,
        test: {
          ...shared,
          name: 'page',
          // Page tests answer the network with MSW; unit tests must not gain a
          // network by accident, which is why the projects are split.
          setupFiles: ['./test/setup/base.ts', './test/setup/msw.ts'],
          include: ['app/**/*.test.tsx'],
          exclude: ['**/node_modules/**', '.next/**'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // app/** belongs in the denominator. It was left out once, and the
      // frontend read 98% while every page sat at 0%.
      include: ['lib/**', 'components/**', 'hooks/**', 'app/**'],
      exclude: [
        '**/*.test.*', 'test/**',
        // Static data tables with no behaviour to exercise.
        'lib/panduan.ts', 'lib/toko-categories.ts', 'lib/chat/types.ts',
      ],
      // A ratchet, not a target: set just under the current numbers so an
      // unrelated change cannot quietly undo this, while leaving room to move.
      thresholds: {
        lines: 89,
        statements: 86,
        functions: 79,
        branches: 78,
      },
    },
  },
});
