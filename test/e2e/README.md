# Acceptance tests

User journeys in a real browser. Two modes.

## Stub mode — the default

```
npm run test:e2e
```

Frontend only; API calls are fulfilled from fixtures in `support/apiStubs.ts`.
Needs no database and runs on a clean checkout, so this is what CI runs on
every push. It proves routing, gating and rendering.

What it cannot prove: that the frontend and backend agree. The fixtures say
whatever they were written to say, so a genuine contract mismatch passes.

## Live mode — a real backend over a seeded database

```
cd ../ut-taiwan-be
cp .env.e2e.example .env.e2e
npm run e2e:up          # supabase start, apply the schema, seed
npm run e2e:serve       # backend on :3001, leave running

cd ../ut-taiwan
E2E_MODE=live npm run test:e2e
```

`*-live.spec.ts` runs only here, and the stubbed specs are skipped — they route
the API away, which would defeat the point.

Tear down with `npm run e2e:down` in the backend. To rebuild the schema from
scratch, `supabase db reset` then `npm run e2e:up` again.

### Seeded accounts

All three share the password `e2e-password-123`.

| Account | Who they are |
|---|---|
| `student@e2e.test` | verified, not a member, semester 3 |
| `member@e2e.test` | active SALUT member, semester 1 — can claim the free almet |
| `admin@e2e.test` | admin |

Plus four modules covering each pricing state (priced, out of stock, zero, and
null), the paid and free almets with M/L/XL variants, orders in each
interesting status, and three SALUT applications waiting on an admin.

The seed is idempotent and refuses to run against anything that is not local
unless `E2E_SEED_ALLOW_REMOTE=yes-i-am-sure` — it writes fabricated orders and
memberships, which would be unrecoverable on the real project.

## Why authentication works the way it does

The backend verifies every request with `supabase.auth.getUser`, so tokens must
be genuine. `auth.setup.ts` signs each account in through the real API, seeds
the three `ut_*` localStorage keys, and saves the browser state — so specs
start authenticated instead of walking the login form. A hand-made JWT would
401 everywhere and `AuthProvider` would clear localStorage on mount, leaving
every spec mysteriously signed out.

## Things the fixtures already handle

`fixtures.ts` deals with three sources of noise, so specs do not have to:

- the SSE stream, which opens for every signed-in user and never closes,
  holding the network permanently busy;
- the chat WebSocket, which retries five times with backoff against a service
  that is not running here;
- native `confirm()`, which gates most admin mutations. Playwright *dismisses*
  dialogs when nothing is listening, so without the fixture every admin
  mutation would silently no-op and still look like a pass. One spec declines
  a prompt deliberately to prove the gate works.
