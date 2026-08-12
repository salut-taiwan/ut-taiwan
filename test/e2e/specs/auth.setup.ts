import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Live mode only. Signs each seeded account in through the real API and saves
// the browser state, so the specs start authenticated instead of walking the
// login form every time.
//
// The tokens have to be genuine: the backend verifies every request with
// supabase.auth.getUser, so a hand-made JWT would 401 everywhere and
// AuthProvider would clear localStorage on mount and look signed out.

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';
const PASSWORD = process.env.E2E_PASSWORD ?? 'e2e-password-123';
const AUTH_DIR = path.resolve(__dirname, '..', '.auth');

const ACCOUNTS = [
  { file: 'student.json', email: 'student@e2e.test' },
  { file: 'member.json', email: 'member@e2e.test' },
  { file: 'admin.json', email: 'admin@e2e.test' },
];

for (const account of ACCOUNTS) {
  setup(`sign in as ${account.email}`, async ({ page, request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: account.email, password: PASSWORD },
    });
    expect(
      res.ok(),
      `${account.email} could not sign in — has scripts/seed-e2e.js been run?`,
    ).toBeTruthy();

    const { token, refreshToken, expiresAt } = await res.json();

    await page.addInitScript(([t, r, e]) => {
      localStorage.setItem('ut_token', t as string);
      localStorage.setItem('ut_refresh_token', r as string);
      localStorage.setItem('ut_expires_at', String(e));
    }, [token, refreshToken, expiresAt]);

    // Let AuthProvider run once, so a token the backend would reject fails
    // here — loudly and in one place — rather than in every spec.
    await page.goto('/');
    await expect(page.getByRole('link', { name: /^masuk$/i })).toHaveCount(0);

    fs.mkdirSync(AUTH_DIR, { recursive: true });
    await page.context().storageState({ path: path.join(AUTH_DIR, account.file) });
  });
}
