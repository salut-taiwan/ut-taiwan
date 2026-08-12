import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductDetail from '@/components/toko/ProductDetail';
import { push } from '@/test/utils/routerMock';
import type { ProductDTO } from '@/types';

const addMerch = vi.fn();
const getClaimCta = vi.fn();
const refreshCart = vi.fn();
const showToast = vi.fn();
let currentUser: { id: string } | null = null;

vi.mock('@/lib/api', () => ({
  api: {
    cart: { addMerch: (...a: unknown[]) => addMerch(...a) },
    products: { getClaimCta: (...a: unknown[]) => getClaimCta(...a) },
  },
}));
vi.mock('@/lib/auth', () => ({ useAuth: () => ({ user: currentUser }) }));
vi.mock('@/lib/cart', () => ({ useCart: () => ({ refreshCart }) }));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast }) }));

const product = (over: Partial<ProductDTO> = {}): ProductDTO => ({
  id: 'p-1',
  category: 'jas-almamater',
  name: 'Jas Almamater UT',
  description: 'Almamater resmi',
  base_price: 350000,
  base_price_display: 'Rp 350.000',
  weight_grams: 800,
  claim_rule: null,
  product_images: [{ id: 'i-1', image_url: '/api/storage/a.png', sort_order: 0 }],
  product_variant_types: [],
  product_skus: [{ id: 'sku-1', price: 350000, price_display: 'Rp 350.000', option_names: [] }],
  ...over,
} as ProductDTO);

const withVariants = () => product({
  product_variant_types: [
    {
      id: 'vt-1', name: 'Ukuran', identifier: 'size', sort_order: 0,
      product_variant_options: [
        { id: 'o-1', value: 'M', hex_color: null, sort_order: 0 },
        { id: 'o-2', value: 'L', hex_color: null, sort_order: 1 },
      ],
    },
  ],
  product_skus: [
    { id: 'sku-m', price: 350000, price_display: 'Rp 350.000', option_names: ['M'] },
    { id: 'sku-l', price: 375000, price_display: 'Rp 375.000', option_names: ['L'] },
  ],
} as Partial<ProductDTO>);

beforeEach(() => {
  addMerch.mockReset().mockResolvedValue({ itemCount: 1 });
  getClaimCta.mockReset().mockResolvedValue({ claim_cta: null });
  refreshCart.mockReset();
  showToast.mockReset();
  currentUser = { id: 'u-1' };
});

describe('a product without variants', () => {
  test('can be added straight away', async () => {
    render(<ProductDetail product={product()} />);
    const button = screen.getByRole('button', { name: /tambah ke keranjang/i });
    expect(button).toBeEnabled();

    await userEvent.click(button);

    expect(addMerch).toHaveBeenCalledWith('sku-1', 1);
    await waitFor(() => expect(refreshCart).toHaveBeenCalled());
  });

  test('shows the product price', () => {
    render(<ProductDetail product={product()} />);
    expect(screen.getAllByText('Rp 350.000').length).toBeGreaterThan(0);
  });
});

describe('a product with variants', () => {
  test('cannot be added until a variant is chosen', () => {
    render(<ProductDetail product={withVariants()} />);
    expect(screen.getByRole('button', { name: /pilih ukuran/i })).toBeDisabled();
  });

  test('adds the SKU matching the chosen variant', async () => {
    render(<ProductDetail product={withVariants()} />);

    await userEvent.click(screen.getByRole('button', { name: 'L' }));
    await userEvent.click(screen.getByRole('button', { name: /tambah ke keranjang/i }));

    expect(addMerch).toHaveBeenCalledWith('sku-l', 1);
  });

  test('the price follows the chosen variant', async () => {
    render(<ProductDetail product={withVariants()} />);

    await userEvent.click(screen.getByRole('button', { name: 'L' }));

    expect(screen.getAllByText('Rp 375.000').length).toBeGreaterThan(0);
  });
});

describe('signed-out shoppers', () => {
  test('are sent to log in instead of hitting the cart API', async () => {
    currentUser = null;
    render(<ProductDetail product={product()} />);

    await userEvent.click(screen.getByRole('button', { name: /tambah ke keranjang/i }));

    expect(push).toHaveBeenCalledWith('/login');
    expect(addMerch).not.toHaveBeenCalled();
  });
});

describe('failures', () => {
  test('a rejected add is surfaced and the button becomes usable again', async () => {
    addMerch.mockRejectedValue(new Error('Stok habis'));
    render(<ProductDetail product={product()} />);

    await userEvent.click(screen.getByRole('button', { name: /tambah ke keranjang/i }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Stok habis', 'error'));
    expect(screen.getByRole('button', { name: /tambah ke keranjang/i })).toBeEnabled();
  });
});

describe('the free SALUT almet', () => {
  const gated = () => product({ claim_rule: 'salut_sem1_once', base_price: 0, base_price_display: 'Gratis' });

  test('asks the backend what this particular user may do', async () => {
    getClaimCta.mockResolvedValue({ claim_cta: { state: 'eligible', label: 'Klaim Gratis', addToCart: true, disabled: false } });
    render(<ProductDetail product={gated()} />);

    await waitFor(() => expect(getClaimCta).toHaveBeenCalledWith('p-1'));
    expect(await screen.findByRole('button', { name: 'Klaim Gratis' })).toBeEnabled();
  });

  test('offers a link rather than a claim when the user must act elsewhere first', async () => {
    getClaimCta.mockResolvedValue({
      claim_cta: { state: 'need_salut', label: 'Daftar SALUT untuk klaim', href: '/salut', disabled: false },
    });
    render(<ProductDetail product={gated()} />);

    const link = await screen.findByRole('link', { name: 'Daftar SALUT untuk klaim' });
    expect(link).toHaveAttribute('href', '/salut');
  });

  test('is disabled once already claimed', async () => {
    getClaimCta.mockResolvedValue({
      claim_cta: { state: 'already_claimed', label: 'Sudah Diklaim', disabled: true },
    });
    render(<ProductDetail product={gated()} />);

    expect(await screen.findByRole('button', { name: 'Sudah Diklaim' })).toBeDisabled();
  });

  test('will not let an eligible member claim before choosing a size', async () => {
    // A wrong-size claim cannot be undone — the entitlement is spent.
    getClaimCta.mockResolvedValue({ claim_cta: { state: 'eligible', label: 'Klaim Gratis', addToCart: true, disabled: false } });
    render(<ProductDetail product={{ ...withVariants(), claim_rule: 'salut_sem1_once' } as ProductDTO} />);

    expect(await screen.findByRole('button', { name: /pilih ukuran/i })).toBeDisabled();
  });

  test('re-asks when the signed-in user changes', async () => {
    getClaimCta.mockResolvedValue({ claim_cta: { state: 'need_login', label: 'Login untuk klaim', href: '/login', disabled: false } });
    const { rerender } = render(<ProductDetail product={gated()} />);
    await waitFor(() => expect(getClaimCta).toHaveBeenCalledTimes(1));

    currentUser = { id: 'u-2' };
    rerender(<ProductDetail product={gated()} />);

    await waitFor(() => expect(getClaimCta).toHaveBeenCalledTimes(2));
  });

  test('a failed lookup leaves the button unavailable rather than wrongly enabled', async () => {
    getClaimCta.mockRejectedValue(new Error('offline'));
    render(<ProductDetail product={gated()} />);

    expect(await screen.findByRole('button', { name: 'Tidak tersedia' })).toBeDisabled();
  });

  test('an ordinary product never asks about claims', async () => {
    render(<ProductDetail product={product()} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /tambah ke keranjang/i })).toBeEnabled());
    expect(getClaimCta).not.toHaveBeenCalled();
  });
});
