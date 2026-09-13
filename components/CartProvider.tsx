"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface CartLine {
  bouquetId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  addItem: (bouquetId: string, quantity?: number) => void;
  removeItem: (bouquetId: string) => void;
  setQuantity: (bouquetId: string, quantity: number) => void;
  clear: () => void;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tia-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load any previously saved cart once, on first mount in the browser.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Ignore a corrupted/unreadable cart — starts empty rather than crashing.
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save on every change, once hydrated (avoids overwriting saved cart with
  // the initial empty array before it's had a chance to load).
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((bouquetId: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.bouquetId === bouquetId);
      if (existing) {
        return prev.map((i) =>
          i.bouquetId === bouquetId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { bouquetId, quantity }];
    });
  }, []);

  const removeItem = useCallback((bouquetId: string) => {
    setItems((prev) => prev.filter((i) => i.bouquetId !== bouquetId));
  }, []);

  const setQuantity = useCallback((bouquetId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.bouquetId === bouquetId ? { ...i, quantity: Math.max(1, quantity) } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, addItem, removeItem, setQuantity, clear, hydrated }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
