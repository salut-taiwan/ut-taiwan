import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'warm';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({
  children, variant = 'primary', size = 'md', isLoading, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-[color,background-color,box-shadow,transform] duration-150 ease-out focus:outline-none focus-visible:ring-[2px] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-px focus-visible:ring-indigo-500 shadow-[0_0_0_0.5px_rgba(4,32,74,0.4),inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(10,69,149,0.20),0_2px_6px_rgba(10,69,149,0.15),0_4px_12px_rgba(10,69,149,0.10)]',
    secondary: 'bg-[var(--surface)] border border-[var(--border-default)] text-[var(--foreground)] hover:bg-[var(--surface-sunken)] hover:border-[var(--border-strong)] focus-visible:ring-slate-400 shadow-[var(--shadow-xs)]',
    outline:   'border border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:shadow-[var(--shadow-xs)] focus-visible:ring-indigo-500',
    danger:    'bg-red-600 text-white hover:bg-red-700 hover:-translate-y-px focus-visible:ring-red-500',
    ghost:     'text-[var(--text-body)] hover:bg-[var(--surface-sunken)] focus-visible:ring-slate-400',
    warm:      'bg-[#E85D26] hover:bg-[#C94F1F] text-white hover:-translate-y-px focus-visible:ring-orange-500 shadow-[0_0_0_0.5px_rgba(80,25,5,0.4),inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(80,25,5,0.20),0_2px_6px_rgba(80,25,5,0.15)]',
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
