import { test as base, expect, type Page } from '@playwright/test';
import { stubApi, type ApiStubs } from './support/apiStubs';

// Three things in this app make a browser test noisy unless they are handled
// once, centrally:
//
//   * AuthProvider opens an SSE stream for every signed-in user and never
//     closes it, which holds the network permanently busy.
//   * The chat widget opens a WebSocket and retries five times with backoff
//     against a service that is not running here.
//   * Native confirm() gates most admin mutations, and Playwright silently
//     DISMISSES dialogs when nothing is listening — which would make every
//     mutation a no-op that still looked like a pass.

interface Fixtures {
  quietNetwork: void;
  dialogs: {
    messages: string[];
    /** Dismiss the next dialog instead of accepting it. */
    declineNext: () => void;
  };
  api: (stubs?: ApiStubs) => Promise<void>;
}

export const test = base.extend<Fixtures>({
  quietNetwork: [async ({ page }, use) => {
    await page.route('**/sse/status*', route => route.abort());
    await page.route('**/_vercel/**', route => route.abort());
    await use();
  }, { auto: true }],

  dialogs: async ({ page }, use) => {
    const messages: string[] = [];
    let declineOnce = false;

    page.on('dialog', async dialog => {
      messages.push(dialog.message());
      if (declineOnce) {
        declineOnce = false;
        await dialog.dismiss();
      } else {
        await dialog.accept();
      }
    });

    await use({ messages, declineNext: () => { declineOnce = true; } });
  },

  api: async ({ page }, use) => {
    await use((stubs: ApiStubs = {}) => stubApi(page, stubs));
  },
});

export { expect };
export type { Page };
