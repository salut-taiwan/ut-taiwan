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

export const routerMock = {
  useRouter: () => ({ push, replace, refresh, back, forward, prefetch }),
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
