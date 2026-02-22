'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  ShopifyCart,
  createCart,
  getCart,
  addToCart,
  removeFromCart,
  updateCartLine,
} from '@/lib/shopify/storefront';
import { toast } from 'sonner';

const CART_ID_KEY = 'shopify_cart_id';

interface CartContextValue {
  cart:          ShopifyCart | null;
  totalQuantity: number;
  subtotal:      number;
  loading:       boolean;
  drawerOpen:    boolean;
  openDrawer:    () => void;
  closeDrawer:   () => void;
  addItem:       (variantId: string, quantity: number, attributes?: { key: string; value: string }[]) => Promise<void>;
  updateItem:    (lineId: string, quantity: number) => Promise<void>;
  removeItem:    (lineId: string) => Promise<void>;
  goToCheckout:  () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart]             = useState<ShopifyCart | null>(null);
  const [loading, setLoading]       = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalQuantity = cart?.totalQuantity ?? 0;
  const subtotal      = parseFloat(cart?.cost.subtotalAmount.amount ?? '0');

  useEffect(() => {
    (async () => {
      try {
        const savedId = localStorage.getItem(CART_ID_KEY);
        if (savedId) {
          const existing = await getCart(savedId);
          if (existing) { setCart(existing); return; }
        }
        const fresh = await createCart();
        localStorage.setItem(CART_ID_KEY, fresh.id);
        setCart(fresh);
      } catch (e) {
        console.error('Cart init error:', e);
      }
    })();
  }, []);

  const ensureCartId = async (): Promise<string> => {
    if (cart?.id) return cart.id;
    const fresh = await createCart();
    localStorage.setItem(CART_ID_KEY, fresh.id);
    setCart(fresh);
    return fresh.id;
  };

  const addItem = useCallback(async (
    variantId: string,
    quantity: number,
    attributes: { key: string; value: string }[] = []
  ) => {
    setLoading(true);
    try {
      const cartId  = await ensureCartId();
      const updated = await addToCart(cartId, variantId, quantity, attributes);
      setCart(updated);
      setDrawerOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Errore aggiunta al carrello');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    if (!cart?.id) return;
    setLoading(true);
    try {
      const updated = await updateCartLine(cart.id, lineId, quantity);
      setCart(updated);
    } catch {
      toast.error('Errore aggiornamento quantità');
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart?.id) return;
    setLoading(true);
    try {
      const updated = await removeFromCart(cart.id, lineId);
      setCart(updated);
    } catch {
      toast.error('Errore rimozione elemento');
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const goToCheckout = () => {
    if (cart?.checkoutUrl) window.location.href = cart.checkoutUrl;
    else toast.error('Carrello non disponibile');
  };

  return (
    <CartContext.Provider value={{
      cart, totalQuantity, subtotal, loading,
      drawerOpen,
      openDrawer:  () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem, updateItem, removeItem, goToCheckout,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve essere usato dentro CartProvider');
  return ctx;
}
