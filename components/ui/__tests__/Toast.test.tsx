import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function Trigger() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Tersimpan')}>sukses</button>
      <button onClick={() => showToast('Gagal menyimpan', 'error')}>gagal</button>
    </div>
  );
}

const renderToast = () => render(<ToastProvider><Trigger /></ToastProvider>);

beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => { vi.useRealTimers(); });

describe('Toast', () => {
  test('a message appears when raised', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderToast();

    await user.click(screen.getByRole('button', { name: 'sukses' }));

    expect(screen.getByText('Tersimpan')).toBeInTheDocument();
  });

  test('a failure is styled differently from a success', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderToast();

    await user.click(screen.getByRole('button', { name: 'sukses' }));
    await user.click(screen.getByRole('button', { name: 'gagal' }));

    const success = screen.getByText('Tersimpan').className;
    const failure = screen.getByText('Gagal menyimpan').className;
    expect(success).not.toBe(failure);
    expect(failure).toContain('red');
  });

  test('a message clears itself after a few seconds', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderToast();
    await user.click(screen.getByRole('button', { name: 'sukses' }));

    await act(async () => { vi.advanceTimersByTime(3000 + 200); });

    await waitFor(() => expect(screen.queryByText('Tersimpan')).not.toBeInTheDocument());
  });

  test('the message stays put until its time is up', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderToast();
    await user.click(screen.getByRole('button', { name: 'sukses' }));

    await act(async () => { vi.advanceTimersByTime(2500); });

    expect(screen.getByText('Tersimpan')).toBeInTheDocument();
  });

  test('several messages stack rather than replacing each other', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderToast();

    await user.click(screen.getByRole('button', { name: 'sukses' }));
    await user.click(screen.getByRole('button', { name: 'gagal' }));

    expect(screen.getByText('Tersimpan')).toBeInTheDocument();
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  test('dismissing one message leaves a later one alone', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderToast();

    await user.click(screen.getByRole('button', { name: 'sukses' }));
    await act(async () => { vi.advanceTimersByTime(1500); });
    await user.click(screen.getByRole('button', { name: 'gagal' }));

    // The first expires while the second is still young.
    await act(async () => { vi.advanceTimersByTime(1500 + 200); });

    await waitFor(() => expect(screen.queryByText('Tersimpan')).not.toBeInTheDocument());
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  test('useToast outside a provider is a no-op rather than a crash', () => {
    // A component rendered outside the provider should not take the page down.
    expect(() => render(<Trigger />)).not.toThrow();
  });
});
