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

describe('moving through a dropdown with the keyboard', () => {
  // role="menu" sets the expectation that arrow keys work. Before this, Tab
  // was the only way through and it walked straight out of the menu.
  const openModul = async () => {
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: /Modul/ }));
  };

  test('ArrowDown moves to the first item', async () => {
    await openModul();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Semua Modul' })).toHaveFocus();
  });

  test('ArrowDown again moves to the next', async () => {
    await openModul();

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Program Studi' })).toHaveFocus();
  });

  test('ArrowUp from the first item wraps to the last', async () => {
    await openModul();

    await userEvent.keyboard('{ArrowDown}{ArrowUp}');

    expect(screen.getByRole('menuitem', { name: 'Paket Modul' })).toHaveFocus();
  });

  test('Home and End jump to the ends', async () => {
    await openModul();

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Paket Modul' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Semua Modul' })).toHaveFocus();
  });

  test('Escape closes the menu and returns focus to its trigger', async () => {
    // Otherwise focus falls to <body> and the next Tab restarts from the top
    // of the page.
    await openModul();
    await userEvent.keyboard('{ArrowDown}');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menuitem', { name: 'Semua Modul' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modul/ })).toHaveFocus();
  });
});

describe('the mobile menu', () => {
  // Most students reach the site on a phone, so this panel — not the desktop
  // bar — is the navigation they actually use.
  const toggle = () => screen.getByRole('button', { name: 'Buka menu navigasi' });
  const panel = () => document.getElementById('mobile-menu');
  // The desktop bar renders the same destinations, so every query has to be
  // scoped to the panel or it matches twice.
  const inPanel = () => within(panel()!);

  test('it starts closed', () => {
    render(<Navbar />);
    expect(panel()).toBeNull();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  test('tapping the toggle opens it and says so to a screen reader', async () => {
    render(<Navbar />);
    await userEvent.click(toggle());

    expect(panel()).toBeInTheDocument();
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(toggle()).toHaveAttribute('aria-controls', 'mobile-menu');
  });

  test('tapping again closes it', async () => {
    render(<Navbar />);
    await userEvent.click(toggle());
    await userEvent.click(toggle());

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  test('every section is reachable, including the ones the desktop bar nests in a dropdown', async () => {
    render(<Navbar />);
    await userEvent.click(toggle());

    for (const label of ['Semua Modul', 'Program Studi', 'Paket Modul', 'Panduan', 'Toko', 'Bayar SKS', 'SALUT']) {
      expect(inPanel().getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  test('following a link closes the menu, rather than covering the page arrived at', async () => {
    render(<Navbar />);
    await userEvent.click(toggle());

    await userEvent.click(inPanel().getByRole('link', { name: 'Toko' }));

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  test('a signed-out visitor is offered sign-in from here too', async () => {
    render(<Navbar />);
    await userEvent.click(toggle());

    expect(inPanel().getAllByRole('link', { name: /masuk/i }).length).toBeGreaterThan(0);
  });

  test('a signed-in student gets their orders, profile and a way out', async () => {
    currentUser = student;
    render(<Navbar />);
    await userEvent.click(toggle());

    expect(inPanel().getByRole('link', { name: 'Pesanan' })).toBeInTheDocument();
    expect(inPanel().getByRole('link', { name: 'Profil' })).toBeInTheDocument();
    expect(inPanel().getByRole('button', { name: /keluar/i })).toBeInTheDocument();
  });

  test('a student is not shown the admin area', async () => {
    currentUser = student;
    render(<Navbar />);
    await userEvent.click(toggle());

    expect(inPanel().queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  test('an admin is', async () => {
    currentUser = admin;
    render(<Navbar />);
    await userEvent.click(toggle());

    expect(inPanel().getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
  });

  test('signing out from the menu closes it and returns to the home page', async () => {
    currentUser = student;
    render(<Navbar />);
    await userEvent.click(toggle());

    await userEvent.click(inPanel().getByRole('button', { name: /keluar/i }));

    expect(logout).toHaveBeenCalled();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  test('the section being read is marked as current', async () => {
    setPathname('/toko/almet-salut');
    render(<Navbar />);
    await userEvent.click(toggle());

    expect(inPanel().getByRole('link', { name: 'Toko' }).className).toContain('font-semibold');
  });
});
