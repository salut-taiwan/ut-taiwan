import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import ProgramPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';

const faculties = [
  { id: 'f-1', code: 'FST', name: 'Sains dan Teknologi' },
  { id: 'f-2', code: 'FEB', name: 'Ekonomi dan Bisnis' },
];
const programs = [
  { id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi', faculty_id: 'f-1' },
  { id: 'pr-2', code: 'S1MA', name: 'Manajemen', faculty_id: 'f-2' },
];

async function show({ list = programs, facultyList = faculties } = {}) {
  server.use(
    http.get(url('/catalog/faculties'), () => HttpResponse.json(facultyList)),
    http.get(url('/catalog/programs'), ({ request }) => {
      const code = new URL(request.url).searchParams.get('facultyCode');
      return HttpResponse.json(
        code ? list.filter((p) => p.faculty_id === facultyList.find((f) => f.code === code)?.id) : list,
      );
    }),
  );
  renderPage(<ProgramPage />);
  await screen.findByRole('heading', { name: 'Program Studi' });
}

describe('choosing a programme', () => {
  test('every programme is listed', async () => {
    await show();

    expect(await screen.findByText('Sistem Informasi')).toBeInTheDocument();
    expect(screen.getByText('Manajemen')).toBeInTheDocument();
  });

  test('a programme links to its module list', async () => {
    await show();

    expect(await screen.findByRole('link', { name: /Sistem Informasi/ })).toHaveAttribute(
      'href',
      '/program/pr-1',
    );
  });

  test('the faculties are offered as filters, by their code', async () => {
    await show();

    expect(await screen.findByRole('button', { name: 'FST' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FEB' })).toBeInTheDocument();
  });

  test('filtering by faculty narrows the list', async () => {
    await show();
    await screen.findByText('Manajemen');

    await userEvent.click(await screen.findByRole('button', { name: 'FST' }));

    await waitFor(() => expect(screen.queryByText('Manajemen')).not.toBeInTheDocument());
    expect(screen.getByText('Sistem Informasi')).toBeInTheDocument();
  });

  test('the filter can be cleared again', async () => {
    await show();
    await userEvent.click(await screen.findByRole('button', { name: 'FST' }));
    await waitFor(() => expect(screen.queryByText('Manajemen')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Semua Fakultas' }));

    expect(await screen.findByText('Manajemen')).toBeInTheDocument();
  });

  test('a faculty list that will not load still shows the programmes', async () => {
    // The filter is a convenience; losing it must not hide the catalogue.
    server.use(http.get(url('/catalog/faculties'), () => HttpResponse.error()));
    server.use(http.get(url('/catalog/programs'), () => HttpResponse.json(programs)));
    renderPage(<ProgramPage />);

    expect(await screen.findByText('Sistem Informasi')).toBeInTheDocument();
  });

  test('an empty catalogue does not crash the page', async () => {
    await show({ list: [] });

    expect(screen.getByRole('heading', { name: 'Program Studi' })).toBeInTheDocument();
  });
});
