'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface CartContextValue {
  cartCount: number;
  incrementCart: (by?: number) => void;
  syncCartCount: (count: number) => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  cartCount: 0,
  incrementCart: () => {},
  syncCartCount: () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!user) { setCartCount(0); return; }
    const cart = await api.cart.get().catch(() => null);
    setCartCount(cart?.itemCount || 0);
  }, [user]);

  const incrementCart = useCallback((by = 1) => {
    setCartCount(prev => prev + by);
  }, []);

  const syncCartCount = useCallback((count: number) => {
    setCartCount(count);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (user ? api.cart.get().catch(() => null) : Promise.resolve(null)).then((cart) => {
      if (!cancelled) setCartCount(cart?.itemCount || 0);
    });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <CartContext.Provider value={{ cartCount, incrementCart, syncCartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
