'use client'

// src/contexts/CartContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ShopifyCart, createCart, getCart, addToCart, removeFromCart, updateCartLine } from '@/lib/shopify/storefront'
import { toast } from 'sonner'

const CART_ID_KEY = 'shopify_cart_id'

interface CartContextType {
  cart: ShopifyCart | null
  loading: boolean
  addItem: (variantId: string, quantity: number, attributes?: { key: string; value: string }[]) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  totalQuantity: number
  totalAmount: string
  currencyCode: string
  checkoutUrl: string | null
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [loading, setLoading] = useState(false)

  // Carica o crea il carrello all'avvio
  useEffect(() => {
    const initCart = async () => {
      const savedCartId = localStorage.getItem(CART_ID_KEY)
      if (savedCartId) {
        try {
          const existingCart = await getCart(savedCartId)
          if (existingCart) {
            setCart(existingCart)
            return
          }
        } catch {}
      }
      // Crea nuovo carrello
      try {
        const newCart = await createCart()
        localStorage.setItem(CART_ID_KEY, newCart.id)
        setCart(newCart)
      } catch (err) {
        console.error('Error creating cart:', err)
      }
    }
    initCart()
  }, [])

  const addItem = useCallback(async (
    variantId: string,
    quantity: number,
    attributes: { key: string; value: string }[] = []
  ) => {
    if (!cart) return
    setLoading(true)
    try {
      const updated = await addToCart(cart.id, variantId, quantity, attributes)
      setCart(updated)
    } catch (err: any) {
      toast.error(err.message || 'Errore aggiunta al carrello')
    } finally {
      setLoading(false)
    }
  }, [cart])

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart) return
    setLoading(true)
    try {
      const updated = await removeFromCart(cart.id, lineId)
      setCart(updated)
    } catch (err: any) {
      toast.error(err.message || 'Errore rimozione dal carrello')
    } finally {
      setLoading(false)
    }
  }, [cart])

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return
    setLoading(true)
    try {
      const updated = await updateCartLine(cart.id, lineId, quantity)
      setCart(updated)
    } catch (err: any) {
      toast.error(err.message || 'Errore aggiornamento carrello')
    } finally {
      setLoading(false)
    }
  }, [cart])

  const totalQuantity = cart?.totalQuantity ?? 0
  const totalAmount = cart?.cost.totalAmount.amount ?? '0'
  const currencyCode = cart?.cost.totalAmount.currencyCode ?? 'EUR'
  const checkoutUrl = cart?.checkoutUrl ?? null

  return (
    <CartContext.Provider value={{
      cart, loading,
      addItem, removeItem, updateItem,
      totalQuantity, totalAmount, currencyCode, checkoutUrl,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
