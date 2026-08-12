import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import AdminScraperPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { ScraperRunDTO } from '@/types';

const run = (over: Partial<ScraperRunDTO> = {}): ScraperRunDTO =>
  ({
    id: 'r-1',
    status: 'completed',
    started_at: '2026-05-20T00:00:00Z',
    finished_at: '2026-05-20T00:30:00Z',
    modules_added: 3,
    modules_updated: 12,
    modules_removed: 0,
    error_message: null,
    ...over,
  }) as ScraperRunDTO;

async function show(runs: ScraperRunDTO[] = [run()]) {
  server.use(
    signedInAs(fx.adminProfile()),
    http.get(url('/scraper/runs'), () => HttpResponse.json(runs)),
  );
  renderPage(<AdminScraperPage />, { as: 'admin' });
  await screen.findByRole('heading', { name: 'Scraper TBO Karunika' });
}

describe('running the catalogue scraper', () => {
  test('an admin can start a run', async () => {
    await show();
    let started = false;
    server.use(
      http.post(url('/scraper/run'), () => {
        started = true;
        return HttpResponse.json({ runId: 'r-2' });
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Jalankan Sekarang' }));

    await waitFor(() => expect(started).toBe(true));
  });

  test('a refused start says why rather than looking like it began', async () => {
    // Two concurrent scrapes fight over the same catalogue rows.
    await show();
    server.use(
      http.post(url('/scraper/run'), () =>
        HttpResponse.json({ error: 'Scraper sedang berjalan' }, { status: 409 }),
      ),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Jalankan Sekarang' }));

    expect(await screen.findByText(/sedang berjalan/)).toBeInTheDocument();
  });

  test('past runs are listed with what they changed', async () => {
    await show();

    expect(await screen.findByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  test('a failed run shows its error', async () => {
    // Otherwise a silent failure looks like a run that found nothing.
    await show([run({ status: 'failed', error_message: 'TBO tidak dapat diakses' })]);

    expect(await screen.findByText(/TBO tidak dapat diakses/)).toBeInTheDocument();
  });

  test('no runs yet is an empty list rather than an error', async () => {
    await show([]);

    expect(screen.getByRole('heading', { name: 'Scraper TBO Karunika' })).toBeInTheDocument();
  });
});
