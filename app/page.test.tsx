import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import Home from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';

describe('the home route', () => {
  test('it renders the landing page with the fees it fetched', async () => {
    render(await Home());

    expect(screen.getByRole('heading', { name: 'Layanan kami' })).toBeInTheDocument();
  });

  test('a fee config that 500s does not stop the page rendering', async () => {
    // getFees swallows the failure and passes null; the landing page is the
    // first thing a visitor sees.
    server.use(http.get(url('/config/fees'), () => HttpResponse.json({}, { status: 500 })));

    render(await Home());

    expect(screen.getByRole('heading', { name: 'Layanan kami' })).toBeInTheDocument();
  });

  test('an unreachable backend does not stop it either', async () => {
    server.use(http.get(url('/config/fees'), () => HttpResponse.error()));

    render(await Home());

    expect(screen.getByRole('heading', { name: 'Layanan kami' })).toBeInTheDocument();
  });
});
