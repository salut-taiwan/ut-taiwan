import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '@/lib/cart';

const cartGet = vi.fn();
let currentUser: { id: string } | null = null;

vi.mock('@/lib/api', () => ({
  api: { cart: { get: () => cartGet() } },
}));
vi.mock('@/lib/auth', () => ({ useAuth: () => ({ user: currentUser }) }));

/** Surfaces the badge count and the three mutators as buttons. */
function Badge() {
  const { cartCount, incrementCart, syncCartCount, refreshCart } = useCart();
  return (
    <div>
      <span data-testid="count">{cartCount}</span>
      <button onClick={() => incrementCart()}>tambah satu</button>
      <button onClick={() => incrementCart(3)}>tambah tiga</button>
      <button onClick={() => syncCartCount(0)}>kosongkan</button>
      <button onClick={() => { void refreshCart(); }}>muat ulang</button>
    </div>
  );
}

const renderCart = () => render(<CartProvider><Badge /></CartProvider>);
const count = () => screen.getByTestId('count');

beforeEach(() => {
  cartGet.mockReset().mockResolvedValue({ itemCount: 2 });
  currentUser = { id: 'u-1' };
});

describe('what the badge shows on load', () => {
  test('a signed-in shopper sees the count from their cart', async () => {
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('2'));
  });

  test('a signed-out visitor sees nothing, and the cart is never fetched', async () => {
    currentUser = null;
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('0'));
    expect(cartGet).not.toHaveBeenCalled();
  });

  test('a failing request leaves the badge at zero instead of breaking the page', async () => {
    // The badge sits in the navbar on every route, so it must never take the
    // page down with it.
    cartGet.mockRejectedValue(new Error('offline'));
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('0'));
  });

  test('a cart with no itemCount reads as zero rather than blank', async () => {
    cartGet.mockResolvedValue({});
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('0'));
  });
});

describe('the badge follows who is signed in', () => {
  test('signing in loads that shopper\'s cart', async () => {
    currentUser = null;
    const { rerender } = renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('0'));

    currentUser = { id: 'u-1' };
    rerender(<CartProvider><Badge /></CartProvider>);

    await waitFor(() => expect(count()).toHaveTextContent('2'));
  });

  test('signing out clears it, so the next visitor sees no leftovers', async () => {
    const { rerender } = renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('2'));

    currentUser = null;
    rerender(<CartProvider><Badge /></CartProvider>);

    await waitFor(() => expect(count()).toHaveTextContent('0'));
  });

  test('a response arriving after unmount does not update anything', async () => {
    // Without the cancelled guard this warns about setting state on an
    // unmounted component, and on a fast route change could show the wrong
    // shopper's count.
    let resolve: (v: { itemCount: number }) => void = () => {};
    cartGet.mockReturnValue(new Promise(r => { resolve = r; }));
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderCart();
    unmount();
    await act(async () => { resolve({ itemCount: 9 }); });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('optimistic updates', () => {
  test('adding an item bumps the badge without waiting for the server', async () => {
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('2'));

    await userEvent.click(screen.getByRole('button', { name: 'tambah satu' }));

    expect(count()).toHaveTextContent('3');
  });

  test('adding several at once bumps by that many', async () => {
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('2'));

    await userEvent.click(screen.getByRole('button', { name: 'tambah tiga' }));

    expect(count()).toHaveTextContent('5');
  });

  test('checkout can set the count outright', async () => {
    // Placing an order empties the cart, and the badge should say so at once.
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('2'));

    await userEvent.click(screen.getByRole('button', { name: 'kosongkan' }));

    expect(count()).toHaveTextContent('0');
  });

  test('a refresh replaces an optimistic guess with the real figure', async () => {
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('2'));
    await userEvent.click(screen.getByRole('button', { name: 'tambah tiga' }));
    expect(count()).toHaveTextContent('5');

    cartGet.mockResolvedValue({ itemCount: 4 });
    await userEvent.click(screen.getByRole('button', { name: 'muat ulang' }));

    await waitFor(() => expect(count()).toHaveTextContent('4'));
  });

  test('refreshing while signed out zeroes the badge without a request', async () => {
    currentUser = null;
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('0'));
    cartGet.mockClear();

    await userEvent.click(screen.getByRole('button', { name: 'muat ulang' }));

    expect(cartGet).not.toHaveBeenCalled();
    expect(count()).toHaveTextContent('0');
  });

  test('a failing refresh leaves the badge at zero rather than throwing', async () => {
    renderCart();
    await waitFor(() => expect(count()).toHaveTextContent('2'));

    cartGet.mockRejectedValue(new Error('offline'));
    await userEvent.click(screen.getByRole('button', { name: 'muat ulang' }));

    await waitFor(() => expect(count()).toHaveTextContent('0'));
  });
});

describe('used outside its provider', () => {
  test('useCart quietly does nothing instead of throwing', () => {
    // Unlike useAuth, which throws. A component rendered outside CartProvider
    // shows an empty badge and its add buttons silently do nothing — worth
    // knowing, because the failure is invisible.
    expect(() => render(<Badge />)).not.toThrow();
    expect(count()).toHaveTextContent('0');
  });
});
