'use client';

import { useCart } from '@/contexts/CartContext';
import { CartLine } from '@/lib/shopify/shopify-cart';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

function LineItem({ line }: { line: CartLine }) {
  const { updateItem, removeItem, loading } = useCart();
  const { merchandise, quantity, attributes } = line;

  const colore    = attributes.find(a => a.key === 'colore')?.value;
  const colorHex  = attributes.find(a => a.key === 'colore_hex')?.value;
  const taglia    = attributes.find(a => a.key === 'taglia')?.value;
  const previewUrl = attributes.find(a => a.key === 'preview_url')?.value;

  const price = parseFloat(merchandise.priceV2.amount);

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Preview / immagine prodotto */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
        {previewUrl ? (
          <img src={previewUrl} alt="design" className="w-full h-full object-contain" />
        ) : merchandise.image ? (
          <img src={merchandise.image.url} alt={merchandise.product.title} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">{merchandise.product.title}</p>

        {/* Colore + taglia */}
        <div className="flex items-center gap-2 mt-1">
          {colorHex && (
            <span className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: colorHex }} />
          )}
          <span className="text-xs text-gray-500">
            {colore ?? merchandise.title}
            {taglia && ` · ${taglia}`}
          </span>
        </div>

        {/* Quantità + prezzo */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => quantity > 1 ? updateItem(line.id, quantity - 1) : removeItem(line.id)}
              disabled={loading}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-sm font-semibold">{quantity}</span>
            <button
              onClick={() => updateItem(line.id, quantity + 1)}
              disabled={loading}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">€{(price * quantity).toFixed(2)}</span>
            <button
              onClick={() => removeItem(line.id)}
              disabled={loading}
              className="p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { lines, totalQuantity, subtotal, drawerOpen, closeDrawer, goToCheckout, loading } = useCart();

  // Chiudi con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDrawer]);

  // Blocca scroll body
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            <h2 className="font-bold text-gray-900 text-lg">Carrello</h2>
            {totalQuantity > 0 && (
              <span className="bg-orange-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </div>
          <button onClick={closeDrawer} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenuto */}
        <div className="flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center">
                <ShoppingBag className="w-9 h-9 text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-700 text-lg">Il tuo carrello è vuoto</p>
                <p className="text-gray-400 text-sm mt-1">Aggiungi qualcosa di personalizzato!</p>
              </div>
              <button
                onClick={closeDrawer}
                className="mt-2 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-6 py-3 font-semibold text-sm transition-colors"
              >
                Scopri i prodotti
              </button>
            </div>
          ) : (
            <div className="px-5">
              {lines.map(line => <LineItem key={line.id} line={line} />)}
            </div>
          )}
        </div>

        {/* Footer — solo se ci sono prodotti */}
        {lines.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            {/* Subtotale */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotale</span>
              <span className="font-semibold text-gray-900">€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Spedizione</span>
              <span className={subtotal >= 50 ? 'text-green-600 font-semibold' : 'text-gray-900 font-semibold'}>
                {subtotal >= 50 ? '🎉 Gratuita' : 'Calcolata al checkout'}
              </span>
            </div>

            {/* Barra spedizione gratuita */}
            {subtotal < 50 && (
              <div className="bg-orange-50 rounded-xl p-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-orange-700 font-medium">Aggiungi €{(50 - subtotal).toFixed(2)} per la spedizione gratuita</span>
                  <span className="text-orange-600 font-bold">{Math.round((subtotal / 50) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-orange-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / 50) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* CTA Checkout */}
            <button
              onClick={goToCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white rounded-2xl py-4 font-bold text-base transition-colors shadow-lg"
            >
              Procedi al checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Link pagina carrello */}
            <Link href="/cart" onClick={closeDrawer}
              className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">
              Vedi carrello completo
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
