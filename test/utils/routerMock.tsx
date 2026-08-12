import { vi } from 'vitest';

// A single shared router mock. Tests assert against these spies and set the
// current location with the helpers below.

export const push = vi.fn();
export const replace = vi.fn();
export const refresh = vi.fn();
export const back = vi.fn();
export const forward = vi.fn();
export const prefetch = vi.fn();
export const redirect = vi.fn();
export const notFound = vi.fn();

let pathname = '/';
let searchParams = new URLSearchParams();
let params: Record<string, string> = {};

export function setPathname(next: string) { pathname = next; }
export function setSearchParams(next: string) { searchParams = new URLSearchParams(next); }
export function setParams(next: Record<string, string>) { params = next; }

// One stable object, as Next.js returns. A fresh object per call would change
// identity on every render, so any effect with `router` in its dependency array
// would re-run forever — which looks exactly like a page bug.
const router = { push, replace, refresh, back, forward, prefetch };

export const routerMock = {
  useRouter: () => router,
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
  useParams: () => params,
  redirect,
  notFound,
};

export function resetRouterMock() {
  for (const spy of [push, replace, refresh, back, forward, prefetch, redirect, notFound]) {
    spy.mockClear();
  }
  pathname = '/';
  searchParams = new URLSearchParams();
  params = {};
}
