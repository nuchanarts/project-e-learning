import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  category?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (courseId: string) => void;
  has: (courseId: string) => boolean;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'bgs_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (item: CartItem) => {
    setItems((prev) => (prev.find((i) => i.id === item.id) ? prev : [...prev, item]));
  };

  const remove = (courseId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== courseId));
  };

  const has = (courseId: string) => items.some((i) => i.id === courseId);

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, has, clear, total, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
