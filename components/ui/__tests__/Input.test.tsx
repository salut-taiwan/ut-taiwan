import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import Input from '@/components/ui/Input';

describe('Input', () => {
  test('the label is wired to the field, so clicking it focuses the input', async () => {
    render(<Input label="Nomor WhatsApp" />);
    const field = screen.getByLabelText('Nomor WhatsApp');
    await userEvent.click(screen.getByText('Nomor WhatsApp'));
    expect(field).toHaveFocus();
  });

  test('an explicit id wins over the one derived from the label', () => {
    render(<Input label="Nomor WhatsApp" id="wa" />);
    expect(screen.getByLabelText('Nomor WhatsApp')).toHaveAttribute('id', 'wa');
  });

  test('two fields sharing a label collide on id — pass an explicit one', () => {
    // Documented so a form with a repeated label does not silently break its
    // label association.
    const { container } = render(
      <div>
        <Input label="Nomor" />
        <Input label="Nomor" />
      </div>,
    );
    const ids = [...container.querySelectorAll('input')].map(i => i.id);
    expect(ids[0]).toBe(ids[1]);
  });

  test('without a label there is no orphaned label element', () => {
    const { container } = render(<Input placeholder="Cari" />);
    expect(container.querySelector('label')).toBeNull();
    expect(screen.getByPlaceholderText('Cari')).toBeInTheDocument();
  });

  test('an error is announced to assistive technology and shown', () => {
    render(<Input label="Email" error="Email tidak valid" />);
    const field = screen.getByLabelText('Email');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Email tidak valid')).toBeInTheDocument();
    expect(field.getAttribute('aria-describedby')).toContain('error');
  });

  test('a hint is associated with the field', () => {
    render(<Input label="Email" hint="Gunakan email aktif" />);
    const field = screen.getByLabelText('Email');
    expect(field.getAttribute('aria-describedby')).toContain('hint');
    expect(screen.getByText('Gunakan email aktif')).toBeInTheDocument();
  });

  test('an error replaces the hint — the problem is what matters', () => {
    render(<Input label="Email" hint="Gunakan email aktif" error="Email tidak valid" />);
    expect(screen.getByText('Email tidak valid')).toBeInTheDocument();
    expect(screen.queryByText('Gunakan email aktif')).not.toBeInTheDocument();
  });

  test('a healthy field advertises neither state', () => {
    render(<Input label="Email" />);
    const field = screen.getByLabelText('Email');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(field).not.toHaveAttribute('aria-describedby');
  });

  test('the ref reaches the DOM node so a form can focus it', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Email" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  test('typing reports each change', async () => {
    const onChange = vi.fn();
    render(<Input label="Email" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Email'), 'abc');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  test('a disabled field cannot be typed into', async () => {
    render(<Input label="Email" disabled />);
    const field = screen.getByLabelText('Email');
    await userEvent.type(field, 'abc');
    expect(field).toHaveValue('');
  });

  test('input attributes pass through', () => {
    render(<Input label="Nomor" type="tel" required maxLength={15} />);
    const field = screen.getByLabelText('Nomor');
    expect(field).toHaveAttribute('type', 'tel');
    expect(field).toBeRequired();
    expect(field).toHaveAttribute('maxLength', '15');
  });
});
