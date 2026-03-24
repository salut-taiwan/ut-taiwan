import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children, variant = 'primary', size = 'md', isLoading, icon, iconPosition = 'left', className, disabled, ...props
}, ref) => {
  const base = cn(
    'relative inline-flex items-center justify-center font-semibold',
    'rounded-xl transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-[0.97] active:duration-100',
    'select-none'
  );

  const variants = {
    primary: cn(
      'bg-indigo-600 text-white',
      'shadow-[var(--shadow-btn-primary)]',
      'hover:bg-indigo-700 hover:shadow-[0_2px_4px_rgba(10,69,149,0.20),0_8px_20px_rgba(10,69,149,0.24)]',
      'focus-visible:ring-indigo-500'
    ),
    secondary: cn(
      'bg-white text-slate-700',
      'border border-slate-200 shadow-[var(--shadow-xs)]',
      'hover:bg-slate-50 hover:border-slate-300 hover:shadow-[var(--shadow-card)]',
      'focus-visible:ring-slate-400'
    ),
    outline: cn(
      'bg-transparent text-indigo-600',
      'border-2 border-indigo-200',
      'hover:bg-indigo-50 hover:border-indigo-300',
      'focus-visible:ring-indigo-500'
    ),
    danger: cn(
      'bg-red-600 text-white',
      'shadow-[0_1px_2px_rgba(220,38,38,0.20),0_4px_12px_rgba(220,38,38,0.20)]',
      'hover:bg-red-700 hover:shadow-[0_2px_4px_rgba(220,38,38,0.24),0_8px_20px_rgba(220,38,38,0.28)]',
      'focus-visible:ring-red-500'
    ),
    ghost: cn(
      'text-slate-600',
      'hover:bg-slate-100 hover:text-slate-900',
      'focus-visible:ring-slate-400'
    ),
  };

  const sizes = {
    sm: 'text-sm px-3.5 py-2 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-7 py-3.5 gap-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const LoadingSpinner = () => (
    <svg className={cn('animate-spin', iconSizes[size])} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  const IconWrapper = ({ children: iconChild }: { children: React.ReactNode }) => (
    <span className={cn(iconSizes[size], 'flex items-center justify-center')}>
      {iconChild}
    </span>
  );

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span className="opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <IconWrapper>{icon}</IconWrapper>}
          {children}
          {icon && iconPosition === 'right' && <IconWrapper>{icon}</IconWrapper>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
