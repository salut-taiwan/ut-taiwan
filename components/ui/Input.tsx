import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--foreground)] bg-[var(--surface)]',
          'placeholder:text-[var(--text-muted)]',
          'transition-[border-color,box-shadow] duration-150',
          'focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]',
          'disabled:bg-[var(--surface-sunken)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-100 focus:border-red-400',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
});

export default Input;
