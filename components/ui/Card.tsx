import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(
      'bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]',
      'hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5',
      'transition-[box-shadow,transform] duration-200 ease-out',
      className
    )} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-b border-[var(--border-subtle)]', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-t border-[var(--border-subtle)]', className)} {...props}>
      {children}
    </div>
  );
}
