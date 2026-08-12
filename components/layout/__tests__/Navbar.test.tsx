import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/layout/Navbar';
import { setPathname } from '@/test/utils/routerMock';

const logout = vi.fn();
let currentUser: Record<string, unknown> | null = null;
let cartCount = 0;

vi.mock('@/lib/auth', () => ({ useAuth: () => ({ user: currentUser, logout }) }));
vi.mock('@/lib/cart', () => ({ useCart: () => ({ cartCount }) }));
vi.mock('@/components/ui/ThemeToggle', () => ({ default: () => <button>tema</button> }));

const student = { id: 'u-1', name: 'Budi Santoso', email: 'budi@example.com', role: 'student' };
const admin = { ...student, id: 'u-2', name: 'Admin SALUT', role: 'admin' };

beforeEach(() => {
  logout.mockReset().mockResolvedValue(undefined);
  currentUser = null;
  cartCount = 0;
  setPathname('/');
});

describe('what a signed-out visitor sees', () => {
  test('they are invited to sign in or register', () => {
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /masuk/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /daftar/i })).toBeInTheDocument();
  });

  test('no account menu is offered', () => {
    render(<Navbar />);
    expect(screen.queryByText('BS')).not.toBeInTheDocument();
  });
});

describe('what a signed-in student sees', () => {
  beforeEach(() => { currentUser = student; });

  test('their initials stand in for an avatar', () => {
    render(<Navbar />);
    expect(screen.getAllByText('BS').length).toBeGreaterThan(0);
  });

  test('the sign-in invitation is gone', () => {
    render(<Navbar />);
    expect(screen.queryByRole('link', { name: /^masuk$/i })).not.toBeInTheDocument();
  });

  test('the admin panel is not offered to them', () => {
    render(<Navbar />);
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
  });

  test('signing out clears the session and returns them home', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getAllByText('BS')[0]);

    await userEvent.click(screen.getByRole('menuitem', { name: /keluar/i }));

    expect(logout).toHaveBeenCalled();
  });
});

describe('what an admin sees', () => {
  test('the admin panel is offered, without opening any menu', async () => {
    currentUser = admin;
    render(<Navbar />);
    const link = screen.getAllByRole('link', { name: /^admin$/i })[0];
    expect(link).toHaveAttribute('href', '/admin');
  });
});

describe('the cart badge', () => {
  test('an empty cart shows no badge at all', () => {
    currentUser = student;
    cartCount = 0;
    render(<Navbar />);
    const cart = screen.getAllByRole('link', { name: /keranjang/i })[0];
    expect(within(cart).queryByText('0')).not.toBeInTheDocument();
  });

  test('a filled cart shows the count', () => {
    currentUser = student;
    cartCount = 3;
    render(<Navbar />);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });
});

describe('which section is marked as current', () => {
  test('a module page marks the Modul section', () => {
    setPathname('/modules');
    const { container } = render(<Navbar />);
    expect(container.textContent).toContain('Modul');
  });

  test('a nested module page still marks it', () => {
    // The rule matches the path itself or anything beneath it.
    setPathname('/modules/abc-123');
    const { container } = render(<Navbar />);
    expect(container.textContent).toContain('Modul');
  });

  test('a path that merely starts with the same letters does not', async () => {
    // "/modulesX" is a different section; a naive startsWith would claim it.
    setPathname('/modulesX');
    render(<Navbar />);
    // The inactive class also contains "hover:text-indigo-700", so the marker
    // is the weight, not the colour.
    const trigger = screen.getAllByRole('button', { name: /^modul$/i })[0];
    expect(trigger.className).not.toContain('font-semibold');
  });
});

describe('the dropdown menus', () => {
  test('a menu opens on click', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getAllByRole('button', { name: /^modul$/i })[0]);
    expect(screen.getByRole('menuitem', { name: /semua modul/i })).toBeVisible();
  });

  test('clicking outside closes it', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getAllByRole('button', { name: /^modul$/i })[0]);
    expect(screen.getByRole('menuitem', { name: /semua modul/i })).toBeVisible();

    await userEvent.click(document.body);

    expect(screen.queryByRole('menuitem', { name: /semua modul/i })).not.toBeInTheDocument();
  });

  test('Escape closes it, so the keyboard is not trapped', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getAllByRole('button', { name: /^modul$/i })[0]);

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menuitem', { name: /semua modul/i })).not.toBeInTheDocument();
  });

  test('the trigger reports its state to assistive technology', async () => {
    render(<Navbar />);
    const trigger = screen.getAllByRole('button', { name: /^modul$/i })[0];
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
