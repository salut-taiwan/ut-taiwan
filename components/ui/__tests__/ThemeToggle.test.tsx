import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Providers from '@/components/ui/Providers';

const setTheme = vi.fn();
let resolvedTheme = 'light';

vi.mock('next-themes', async () => {
  const actual = await vi.importActual<typeof import('next-themes')>('next-themes');
  return { ...actual, useTheme: () => ({ resolvedTheme, setTheme }) };
});

beforeEach(() => {
  setTheme.mockReset();
  resolvedTheme = 'light';
});

describe('ThemeToggle', () => {
  test('in light mode it offers to turn the lights off', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Aktifkan mode gelap' })).toBeInTheDocument();
  });

  test('in dark mode it offers to turn them back on', () => {
    resolvedTheme = 'dark';
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Aktifkan mode terang' })).toBeInTheDocument();
  });

  test('clicking it switches to dark', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  test('clicking it again switches back to light', async () => {
    resolvedTheme = 'dark';
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  test('it reserves its space before mount, so the navbar does not jump', () => {
    // The server cannot know the theme, so the first paint is a placeholder of
    // exactly the button's size rather than nothing.
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('p-2');
  });
});

describe('Providers', () => {
  test('it renders the app beneath it', () => {
    render(<Providers><p>halaman</p></Providers>);
    expect(screen.getByText('halaman')).toBeInTheDocument();
  });
});
