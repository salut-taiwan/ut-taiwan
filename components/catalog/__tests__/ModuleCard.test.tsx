import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModuleCard from '@/components/catalog/ModuleCard';
import type { ModuleSummaryDTO } from '@/types';

const addItem = vi.fn(async () => ({ itemCount: 1 }));
const showToast = vi.fn();

vi.mock('@/lib/api', () => ({ api: { cart: { addItem: (...args: unknown[]) => addItem(...(args as [])) } } }));
vi.mock('@/lib/auth', () => ({ useAuth: () => ({ user: { id: 'u-1' } }) }));
vi.mock('@/lib/cart', () => ({ useCart: () => ({ syncCartCount: vi.fn() }) }));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast }) }));
vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <img alt={String(props.alt)} /> }));
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));

function moduleFixture(over: Partial<ModuleSummaryDTO> = {}): ModuleSummaryDTO {
  return {
    id: 'm-1',
    tbo_code: 'MKDU4109',
    name: 'Bahasa Inggris',
    cover_image_url: null,
    price_student: 50000,
    is_available: true,
    price_student_display: 'Rp 50.000',
    ...over,
  };
}

beforeEach(() => {
  addItem.mockClear();
  showToast.mockClear();
});

describe('ModuleCard', () => {
  test('a priced, in-stock module shows its price and a buy button', () => {
    render(<ModuleCard module={moduleFixture()} />);
    expect(screen.getByText('Rp 50.000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah ke Keranjang' })).toBeInTheDocument();
  });

  test('a module with price 0 is unpriced, not free', () => {
    render(<ModuleCard module={moduleFixture({ price_student: 0, price_student_display: 'Gratis' })} />);
    expect(screen.getByText('Hubungi Kami')).toBeInTheDocument();
    expect(screen.queryByText('Gratis')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minta Buku Ini' })).toBeInTheDocument();
  });

  test('an out-of-stock module keeps its price but must be requested', () => {
    render(<ModuleCard module={moduleFixture({ is_available: false })} />);
    expect(screen.getByText('Rp 50.000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minta Buku Ini' })).toBeInTheDocument();
  });

  test('adding an unpriced module reports it as a request, not a purchase', async () => {
    render(<ModuleCard module={moduleFixture({ price_student: 0 })} />);
    await userEvent.click(screen.getByRole('button', { name: 'Minta Buku Ini' }));
    expect(addItem).toHaveBeenCalledWith('m-1');
    expect(showToast).toHaveBeenCalledWith('Modul ditambahkan sebagai permintaan!');
  });

  test('adding a purchasable module reports a cart addition', async () => {
    render(<ModuleCard module={moduleFixture()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tambah ke Keranjang' }));
    expect(showToast).toHaveBeenCalledWith('Modul ditambahkan ke keranjang!');
  });
});
