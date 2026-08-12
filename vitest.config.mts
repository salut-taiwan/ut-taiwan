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
      include: ['lib/**', 'components/**', 'hooks/**'],
      exclude: [
        '**/*.test.*', 'test/**',
        'lib/panduan.ts', 'lib/toko-categories.ts', 'lib/chat/types.ts',
      ],
    },
  },
});
