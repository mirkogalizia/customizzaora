'use client';

import { useCart } from '@/contexts/CartContext';
import { CartLine } from '@/lib/shopify/shopify-cart';
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight,
  Package, ArrowLeft, RotateCcw, Tag
} from 'lucide-react';
import Link from 'next/link';

function CartLineRow({ line }: { line: CartLine }) {
  const { updateItem, removeItem, loading } = useCart();
  const { merchandise, quantity, attributes } = line;

  const colore     = attributes.find(a => a.key === 'colore')?.value;
  const colorHex   = attributes.find(a => a.key === 'colore_hex')?.value;
  const taglia     = attributes.find(a => a.key === 'taglia')?.value;
  const previewUrl = attributes.find(a => a.key === 'preview_url')?.value;
  const handle     = attributes.find(a => a.key === 'handle')?.value;

  const price      = parseFloat(merchandise.priceV2.amount);
  const lineTotal  = price * quantity;

  return (
    <div className="flex gap-4 py-6 border-b border-gray-100">
      {/* Immagine */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
        {previewUrl ? (
          <img src={previewUrl} alt="preview design" className="w-full h-full object-contain" />
        ) : merchandise.image ? (
          <img src={merchandise.image.url} alt={merchandise.product.title} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-200" />
          </div>
        )}
        {previewUrl && (
          <div className="absolute bottom-1 right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            DESIGN
          </div>
        )}
      </div>

      {/* Dettagli */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">{merchandise.product.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              {colorHex && (
                <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: colorHex }} />
              )}
              <span className="text-sm text-gray-500">
                {colore ?? merchandise.title}
                {taglia && <span className="font-medium text-gray-700"> · {taglia}</span>}
              </span>
            </div>

            {handle && (
              <Link href={`/products/${handle}`}
                className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 mt-2 transition-colors">
                <RotateCcw className="w-3 h-3" />Modifica design
              </Link>
            )}
          </div>

          {/* Prezzo desktop */}
          <span className="hidden md:block text-lg font-bold text-gray-900 flex-shrink-0">
            €{lineTotal.toFixed(2)}
          </span>
        </div>

        {/* Quantità + rimuovi */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => quantity > 1 ? updateItem(line.id, quantity - 1) : removeItem(line.id)}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-bold text-sm">{quantity}</span>
            <button
              onClick={() => updateItem(line.id, quantity + 1)}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Prezzo mobile */}
            <span className="md:hidden font-bold text-gray-900">€{lineTotal.toFixed(2)}</span>
            <button
              onClick={() => removeItem(line.id)}
              disabled={loading}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { lines, totalQuantity, subtotal, goToCheckout, loading } = useCart();
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total    = subtotal + shipping;

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Il carrello è vuoto</h1>
          <p className="text-gray-500 mb-8">Personalizza un prodotto e aggiungilo qui!</p>
          <Link href="/products"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-8 py-4 font-bold text-base transition-colors">
            <ShoppingBag className="w-5 h-5" />Sfoglia i prodotti
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/products"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />Continua lo shopping
          </Link>
          <Link href="/" className="text-xl font-bold text-orange-600">Print Shop</Link>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <ShoppingBag className="w-4 h-4" />
            {totalQuantity} {totalQuantity === 1 ? 'articolo' : 'articoli'}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Il tuo carrello</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lista prodotti */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
              {lines.map(line => <CartLineRow key={line.id} line={line} />)}
            </div>
          </div>

          {/* Riepilogo ordine */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24 space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Riepilogo ordine</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotale</span>
                  <span className="font-medium">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Spedizione</span>
                  <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-medium'}>
                    {shipping === 0 ? '🎉 Gratuita' : `€${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping === 0 && subtotal >= 50 && (
                  <div className="flex items-center gap-1.5 text-green-700 bg-green-50 rounded-xl px-3 py-2 text-xs font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    Spedizione gratuita applicata!
                  </div>
                )}
              </div>

              {/* Barra spedizione gratuita */}
              {subtotal < 50 && (
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-orange-700 font-medium mb-1.5">
                    Aggiungi <strong>€{(50 - subtotal).toFixed(2)}</strong> per la spedizione gratuita
                  </p>
                  <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="font-bold text-gray-900">Totale</span>
                <span className="text-2xl font-bold text-gray-900">€{total.toFixed(2)}</span>
              </div>

              <button
                onClick={goToCheckout}
                disabled={loading || lines.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-2xl py-4 font-bold text-base transition-colors shadow-md"
              >
                Checkout sicuro <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust badges */}
              <div className="pt-2 space-y-2">
                {[
                  '🔒 Pagamento sicuro SSL',
                  '⚡ Spedizione in 24 ore',
                  '↩️ Reso gratuito 30 giorni',
                ].map(b => (
                  <p key={b} className="text-xs text-gray-400 flex items-center gap-1">{b}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
