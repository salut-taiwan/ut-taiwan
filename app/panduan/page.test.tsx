import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import PanduanPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';

const guides = [
  {
    id: 'registrasi-matakuliah',
    guides: [{ title: 'Panduan Registrasi Mata Kuliah', url: 'https://cdn/reg.pdf' }],
  },
];

async function show(payload: unknown = guides) {
  server.use(
    http.get(url('/panduan'), () =>
      payload === 'error'
        ? HttpResponse.error()
        : HttpResponse.json(payload as never),
    ),
  );
  render(await PanduanPage());
}

describe('the guide library', () => {
  test('guides from the backend are listed with working links', async () => {
    await show();

    // The title is a label beside the actions; the actions carry the URL.
    expect(screen.getByText('Panduan Registrasi Mata Kuliah')).toBeInTheDocument();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://cdn/reg.pdf');
  });

  test('the categories are always shown, even with no guides in them', async () => {
    // The categories are the page's structure; an empty one still tells a
    // student what exists.
    await show([]);

    expect(screen.getByRole('heading', { name: 'Panduan UT Taiwan' })).toBeInTheDocument();
  });

  test('a backend that cannot be reached still renders the page', async () => {
    // It is statically revalidated; a failed revalidate must not 500 the page.
    await show('error');

    expect(screen.getByRole('heading', { name: 'Panduan UT Taiwan' })).toBeInTheDocument();
  });

  test('the useful external links are offered', async () => {
    await show();

    expect(screen.getByRole('heading', { name: 'Tautan Berguna' })).toBeInTheDocument();
  });
});
