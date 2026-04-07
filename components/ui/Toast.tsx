'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error';
interface ToastItem { id: number; message: string; type: ToastType; }

const ToastContext = createContext<{ showToast: (msg: string, type?: ToastType) => void }>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [exiting, setExiting] = useState<Set<number>>(new Set());
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    // Mark as exiting → play exit animation → then remove (rule 3.2: exit prop required)
    setExiting(prev => new Set(prev).add(id));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      setExiting(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 160);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`flex items-center gap-3 bg-[var(--surface)] rounded-xl px-4 py-3 text-sm font-medium shadow-[var(--shadow-lg)] border border-l-[3px]
              ${exiting.has(t.id)
                ? 'animate-[slideOutDown_150ms_ease-in_forwards]'
                : 'animate-[slideInUp_200ms_ease-out]'
              }
              ${t.type === 'success'
                ? 'border-[var(--border)] border-l-emerald-500 text-emerald-700'
                : 'border-[var(--border)] border-l-red-500 text-red-700'
              }`}>
            {t.type === 'success' ? (
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
