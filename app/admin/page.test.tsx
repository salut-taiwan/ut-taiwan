import { describe, expect, test } from 'vitest';
import { HttpResponse, http } from 'msw';
import AdminDashboardPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

async function show() {
  server.use(signedInAs(fx.adminProfile()));
  renderPage(<AdminDashboardPage />, { as: 'admin' });
  await screen.findByRole('heading', { name: 'Admin Dashboard' });
}

describe('the admin dashboard', () => {
  test('a student is turned away', async () => {
    server.use(signedInAs(fx.profile()));

    renderPage(<AdminDashboardPage />, { as: 'student' });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  test('a signed-out visitor is turned away too', async () => {
    renderPage(<AdminDashboardPage />);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  test('an admin gets the dashboard', async () => {
    await show();

    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
  });

  test('every admin area is linked from here', async () => {
    await show();

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    for (const area of ['/admin/orders', '/admin/users', '/admin/salut-applications']) {
      expect(hrefs).toContain(area);
    }
  });

  test('a scraper history that will not load does not take the dashboard with it', async () => {
    // The run summary is a convenience; the navigation is the point.
    server.use(
      signedInAs(fx.adminProfile()),
      http.get(url('/scraper/runs'), () => HttpResponse.error()),
    );
    renderPage(<AdminDashboardPage />, { as: 'admin' });

    expect(await screen.findByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
  });
});
