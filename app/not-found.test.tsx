import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotFound from './not-found';
import ErrorBoundary from './error';
import Loading from './loading';

/**
 * The three route-level pages the app was missing entirely. Before these, a
 * bad URL or an uncaught render error dropped the user onto Next's default
 * screens: unstyled, in English, with no way back into the site.
 */

describe('the 404 page', () => {
  test('it says plainly what happened', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  test('it carries the mark, so it still looks like the site', () => {
    render(<NotFound />);

    expect(screen.getByAltText('SALUT UT Taiwan')).toBeInTheDocument();
  });

  test('it offers a way back rather than leaving a dead end', () => {
    render(<NotFound />);

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/program');
    expect(hrefs).toContain('/panduan');
  });

  test('it offers a human to ask', () => {
    render(<NotFound />);

    expect(screen.getByRole('link', { name: /Hubungi admin/ })).toHaveAttribute(
      'href',
      'https://wa.me/886936501760',
    );
  });
});

describe('the error boundary', () => {
  // The default export is named Error, which would shadow the constructor —
  // imported as ErrorBoundary so both are usable here.
  const boom = Object.assign(new Error('Kaboom'), { digest: 'abc123' });

  test('it reassures rather than showing a stack trace', () => {
    render(<ErrorBoundary error={boom} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Ada yang tidak beres' })).toBeInTheDocument();
    // The raw message can carry internals and a student cannot act on it.
    expect(screen.queryByText(/Kaboom/)).not.toBeInTheDocument();
  });

  test('it shows the digest, which is what ties the report to a server log', () => {
    render(<ErrorBoundary error={boom} reset={vi.fn()} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  test('retrying calls back into Next rather than reloading the whole app', async () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={boom} reset={reset} />);

    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));

    expect(reset).toHaveBeenCalled();
  });

  test('an error with no digest does not show an empty code line', () => {
    render(<ErrorBoundary error={new Error('x')} reset={vi.fn()} />);

    expect(screen.queryByText(/Kode kesalahan/)).not.toBeInTheDocument();
  });
});

describe('the loading state', () => {
  test('it announces itself rather than being a silent skeleton', () => {
    render(<Loading />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Memuat halaman…')).toBeInTheDocument();
  });
});
