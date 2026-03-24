import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'ghost';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ 
  children, 
  className, 
  variant = 'default',
  hover = true,
  padding = 'none',
  ...props 
}, ref) => {
  const variants = {
    default: cn(
      'bg-white border border-slate-200/80',
      'shadow-[var(--shadow-card)]',
      hover && 'hover:shadow-[var(--shadow-card-hover)] hover:border-slate-200'
    ),
    elevated: cn(
      'bg-white border border-slate-100',
      'shadow-[var(--shadow-elevated)]',
      hover && 'hover:shadow-[var(--shadow-modal)] hover:-translate-y-0.5'
    ),
    outline: cn(
      'bg-white/50 border-2 border-slate-200',
      hover && 'hover:border-indigo-300 hover:bg-white'
    ),
    ghost: cn(
      'bg-transparent border border-transparent',
      hover && 'hover:bg-slate-50 hover:border-slate-200'
    ),
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div 
      ref={ref}
      className={cn(
        'rounded-2xl',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        variants[variant],
        paddings[padding],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({ 
  children, 
  className, 
  title,
  subtitle,
  action,
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref}
      className={cn('px-6 py-5 border-b border-slate-100', className)} 
      {...props}
    >
      {(title || subtitle || action) ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      ) : children}
    </div>
  );
});
CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ 
  children, 
  className, 
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  );
});
CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ 
  children, 
  className, 
  ...props 
}, ref) => {
  return (
    <div 
      ref={ref}
      className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl', className)} 
      {...props}
    >
      {children}
    </div>
  );
});
CardFooter.displayName = 'CardFooter';
