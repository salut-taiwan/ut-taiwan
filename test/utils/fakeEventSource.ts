import { vi } from 'vitest';

/**
 * jsdom ships no EventSource, and AuthProvider opens one for every logged-in
 * user. This records the streams that were opened so a test can assert the URL
 * (the access token travels in the query string) and push frames at the app.
 */
export class FakeEventSource {
  static instances: FakeEventSource[] = [];

  static reset() {
    FakeEventSource.instances = [];
  }

  /** The most recently opened stream, or undefined if none. */
  static get last(): FakeEventSource | undefined {
    return FakeEventSource.instances.at(-1);
  }

  url: string;
  readyState = 0;
  closed = false;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  close = vi.fn(() => { this.closed = true; this.readyState = 2; });

  constructor(url: string | URL) {
    this.url = String(url);
    this.readyState = 1;
    FakeEventSource.instances.push(this);
  }

  addEventListener() {}
  removeEventListener() {}

  /** Deliver a server frame. Objects are JSON-encoded like the real stream. */
  emit(data: unknown) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.onmessage?.({ data: payload } as MessageEvent);
  }

  /** Simulate the connection dropping. */
  fail() {
    this.onerror?.(new Event('error'));
  }
}
