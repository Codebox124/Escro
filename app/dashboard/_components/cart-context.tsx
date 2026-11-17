"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { buyerService } from "@/services/shop";
import { authService } from "@/services/auth";

/**
 * Buyer cart shared across the dashboard (navbar badge, product pages, cart page).
 *
 *   const { items, count, add, update, remove, refresh, loading } = useCart();
 *   await add(productId, 2);   // throws { message } on failure (e.g. out of stock)
 */

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  inStock: boolean;
  image: string | null;
  store: { id: string; name: string; slug: string; logo: string | null; verified: boolean; currency: string };
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
  lineTotal: number;
  available: boolean;
};

type Cart = { items: CartItem[]; count: number };

type CartContextValue = Cart & {
  loading: boolean;
  /** last action in progress, e.g. productId being added */
  busyId: string | null;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const Ctx = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }
    try {
      setCart(await buyerService.getCart());
    } catch {
      /* cart unavailable (e.g. migration not run) — keep empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(refresh);
  }, [refresh]);

  const run = useCallback(async (id: string, action: () => Promise<Cart>) => {
    setBusyId(id);
    try {
      setCart(await action());
    } finally {
      setBusyId(null);
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      ...cart,
      loading,
      busyId,
      refresh,
      add: (productId, quantity = 1) => run(productId, () => buyerService.addToCart(productId, quantity)),
      update: (productId, quantity) => run(productId, () => buyerService.updateCartItem(productId, quantity)),
      remove: (productId) => run(productId, () => buyerService.removeFromCart(productId)),
      clear: () => run("all", () => buyerService.clearCart()),
    }),
    [cart, loading, busyId, refresh, run]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
