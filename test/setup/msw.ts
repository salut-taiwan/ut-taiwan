import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/test/msw/handlers';

export const server = setupServer(...handlers);

beforeAll(() => {
  // A request nobody described is a bug in the test, not something to answer
  // with a silent 404 that the page then renders as an empty state.
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => server.resetHandlers());
afterAll(() => server.close());
