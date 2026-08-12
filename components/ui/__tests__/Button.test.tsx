import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/ui/Button';

describe('Button', () => {
  test('renders its label as a real button', () => {
    render(<Button>Simpan</Button>);
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument();
  });

  test('clicking calls the handler', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Simpan</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('a loading button is disabled, so a form cannot be submitted twice', async () => {
    const onClick = vi.fn();
    render(<Button isLoading onClick={onClick}>Simpan</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('a disabled button ignores clicks', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Simpan</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('each variant renders distinctly', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost'] as const;
    const seen = new Set<string>();
    for (const variant of variants) {
      const { container, unmount } = render(<Button variant={variant}>x</Button>);
      seen.add(container.querySelector('button')!.className);
      unmount();
    }
    expect(seen.size).toBe(variants.length);
  });

  test('each size renders distinctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    const seen = new Set<string>();
    for (const size of sizes) {
      const { container, unmount } = render(<Button size={size}>x</Button>);
      seen.add(container.querySelector('button')!.className);
      unmount();
    }
    expect(seen.size).toBe(sizes.length);
  });

  test('a custom class is added rather than replacing the base styling', () => {
    render(<Button className="mt-4">x</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('mt-4');
    expect(button.className.length).toBeGreaterThan('mt-4'.length);
  });

  test('the button type is passed through so it can submit a form', () => {
    render(<Button type="submit">Kirim</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  test('accessibility attributes pass through', () => {
    render(<Button aria-label="Tutup dialog">×</Button>);
    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toBeInTheDocument();
  });
});
