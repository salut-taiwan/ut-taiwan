import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import React from 'react';
import { routerMock, resetRouterMock } from '@/test/utils/routerMock';
import { FakeEventSource } from '@/test/utils/fakeEventSource';

// Only environment gaps belong here — anything a test might want to assert on
// stays local to that test.

// framer-motion and next-themes both read matchMedia on mount.
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
vi.stubGlobal('IntersectionObserver', NoopObserver);
vi.stubGlobal('ResizeObserver', NoopObserver);
Element.prototype.scrollIntoView = vi.fn();

// AuthProvider opens an EventSource for every logged-in user, and jsdom has
// none — without this every test that renders a session throws.
vi.stubGlobal('EventSource', FakeEventSource);

// Proof and invoice viewing turn blobs into object URLs.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
}

// jsdom throws on native dialogs. Confirmed by default so a test has to opt out
// to assert that a confirmation actually gates something.
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('alert', vi.fn());

// The real hooks throw outside an App Router render.
vi.mock('next/navigation', () => routerMock);

// A rendering shim: keeps alt/src assertions boring and avoids jsdom warnings
// about next/image's own props. next/link is deliberately NOT mocked — it
// renders a real anchor in jsdom, so href assertions stay meaningful.
vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: Record<string, unknown>) => {
    const {
      fill: _fill, priority: _priority, quality: _quality, sizes: _sizes,
      placeholder: _placeholder, blurDataURL: _blur, loader: _loader,
      unoptimized: _unoptimized, onLoadingComplete: _onLoad,
      ...imgProps
    } = rest;
    return React.createElement('img', {
      src: typeof src === 'string' ? src : '',
      alt: typeof alt === 'string' ? alt : '',
      ...imgProps,
    });
  },
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetRouterMock();
  FakeEventSource.reset();
});

afterEach(cleanup);
