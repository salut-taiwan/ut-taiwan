'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { 
  id: number; 
  message: string; 
  type: ToastType; 
  isExiting?: boolean;
}

const ToastContext = createContext<{ showToast: (msg: string, type?: ToastType) => void }>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const removeToast = useCallback((id: number) => {
    // First mark as exiting for animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
    // Then remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 200);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  const styles = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-indigo-600',
    warning: 'bg-amber-500',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t, index) => (
          <div 
            key={t.id}
            style={{ 
              animationDelay: `${index * 50}ms`,
            }}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5 rounded-xl text-white text-sm font-medium',
              'shadow-[var(--shadow-modal)] border border-white/10',
              'pointer-events-auto cursor-pointer',
              'transition-all duration-200',
              styles[t.type],
              t.isExiting 
                ? 'opacity-0 translate-x-4 scale-95' 
                : 'animate-slide-in-up opacity-100'
            )}
            onClick={() => removeToast(t.id)}
          >
            <span className="flex-shrink-0 opacity-90">{icons[t.type]}</span>
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
