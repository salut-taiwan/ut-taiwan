import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({
  children, variant = 'primary', size = 'md', isLoading, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-[color,background-color,box-shadow,transform] duration-150 ease-out focus:outline-none focus-visible:ring-[2px] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-px hover:shadow-[var(--shadow-md)] focus-visible:ring-indigo-500 shadow-[var(--shadow-btn-primary)]',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400 shadow-[var(--shadow-xs)]',
    outline:   'border border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:shadow-[var(--shadow-xs)] focus-visible:ring-indigo-500',
    danger:    'bg-red-600 text-white hover:bg-red-700 hover:-translate-y-px focus-visible:ring-red-500',
    ghost:     'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-7 py-3.5 gap-2',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="border-2 border-current border-t-transparent rounded-full animate-spin w-4 h-4 shrink-0" />
      )}
      {children}
    </button>
  );
}
