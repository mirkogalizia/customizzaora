'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getShopifyProduct, findVariantId, ShopifyProduct } from '@/lib/shopify/storefront';
import { getProductMockups, ColorMockup, PrintAreas } from '@/lib/firebase/mockups';
import { Button } from '@/components/ui/button';
import { CanvasEditor } from '@/components/customizer/CanvasEditor';
import { Toolbar } from '@/components/customizer/Toolbar';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Loader2, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const HANDLE_TO_SHOPIFY_ID: Record<string, string> = {
  'tshirt-personalizzata-spedizione-24h': '15409340350789',
  'felpa-personalizzata-spedizione-24h': '15598323237189',
  'girocollo-personalizzata-spedizione-24h': '15598448148805',
};

const FALLBACK_HEX: Record<string, string> = {
  'Black': '#111111', 'White': '#F5F5F5', 'Navy': '#1B2A4A',
  'Indigo': '#4B0082', 'Light Blue': '#ADD8E6', 'Mint': '#98FFD0',
  'Forest Green': '#228B22', 'Purple': '#800080', 'Red': '#CC0000',
  'Grey': '#888888', 'Gray': '#888888', 'Yellow': '#FFD700',
  'Orange': '#FF6600', 'Pink': '#FFB6C1', 'Brown': '#8B4513', 'Beige': '#F5F5DC',
};

export default function ProductDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const handle  = params.id as string;
  const { addItem, loading: cartLoading, totalQuantity } = useCart();

  const [product, setProduct]               = useState<ShopifyProduct | null>(null);
  const [mockups, setMockups]               = useState<Record<string, ColorMockup>>({});
  const [printAreas, setPrintAreas]         = useState<PrintAreas | null>(null);
  const [loading, setLoading]               = useState(true);
  const [selectedColor, setSelectedColor]   = useState<string | null>(null);
  const [selectedSize, setSelectedSize]     = useState<string>('M');
  const [currentSide, setCurrentSide]       = useState<'front' | 'back'>('front');
  const [quantity, setQuantity]             = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile]             = useState(false);

  // Rileva mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { loadProduct(); }, [handle]);

  const loadProduct = async () => {
    try {
      const sp = await getShopifyProduct(handle);
      if (!sp) { toast.error('Prodotto non trovato'); router.push('/products'); return; }
      setProduct(sp);
      const colors = getUniqueColors(sp);
      if (colors.length > 0) setSelectedColor(colors[0]);

      const shopifyId = HANDLE_TO_SHOPIFY_ID[handle];
      if (shopifyId) {
        const saved = await getProductMockups(shopifyId);
        if (saved?.colors)     setMockups(saved.colors);
        if (saved?.printAreas) setPrintAreas(saved.printAreas);
      }
    } catch (err) {
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  function getUniqueColors(sp: ShopifyProduct): string[] {
    const seen = new Set<string>(); const result: string[] = [];
    for (const { node } of sp.variants.edges) {
      const c = node.selectedOptions.find(o => o.name === 'Colore');
      if (c && !seen.has(c.value)) { seen.add(c.value); result.push(c.value); }
    }
    return result;
  }

  function getAvailableSizes(sp: ShopifyProduct, color: string): string[] {
    return sp.variants.edges
      .filter(({ node }) => node.selectedOptions.find(o => o.name === 'Colore')?.value === color && node.availableForSale)
      .map(({ node }) => node.selectedOptions.find(o => o.name === 'Taglia')?.value ?? '')
      .filter(Boolean);
  }

  const uniqueColors    = product ? getUniqueColors(product) : [];
  const availableSizes  = product && selectedColor ? getAvailableSizes(product, selectedColor) : [];
  const currentMockup   = selectedColor ? mockups[selectedColor] : null;
  // ✅ FIX: usa printAreas dallo state, non da product._mockupData
  const currentPrintArea = printAreas?.[currentSide] ?? null;
  const mockupUrl        = currentMockup
    ? (currentSide === 'front' ? currentMockup.mockupFront : currentMockup.mockupBack)
    : null;
  const price = product ? parseFloat(product.priceRange.minVariantPrice.amount) : 0;

  function getColorHex(colorName: string): string {
    const fromMockup = mockups[colorName]?.colorHex;
    if (fromMockup && fromMockup !== '#000000') return fromMockup;
    const key = Object.keys(FALLBACK_HEX).find(k => k.toLowerCase() === colorName.toLowerCase());
    return key ? FALLBACK_HEX[key] : '#CCCCCC';
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setCurrentSide('front');
    if (product) {
      const sizes = getAvailableSizes(product, color);
      if (sizes.length > 0 && !sizes.includes(selectedSize)) setSelectedSize(sizes[0]);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedColor) { toast.error('Seleziona un colore'); return; }
    if (!product) return;
    try {
      const fc = (window as any).fabricCanvas;
      const previewUrl = fc?.toDataURL ? fc.toDataURL({ format: 'png', quality: 0.7 }) : null;
      const variantId = findVariantId(product, selectedColor, selectedSize);
      if (!variantId) { toast.error(`${selectedColor} / ${selectedSize} non disponibile`); return; }

      const attributes = [
        { key: 'colore',     value: selectedColor },
        { key: 'colore_hex', value: getColorHex(selectedColor) },
        { key: 'taglia',     value: selectedSize },
        { key: 'handle',     value: handle },
        ...(previewUrl ? [{ key: 'preview_url', value: previewUrl }] : []),
      ];
      await addItem(variantId, quantity, attributes);
      toast.success('✅ Aggiunto al carrello!');
    } catch (err: any) {
      toast.error(err.message || 'Errore aggiunta al carrello');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
    </div>
  );
  if (!product) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/products">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Catalogo</Button>
          </Link>
          <Link href="/" className="text-xl font-bold text-orange-600">Print Shop</Link>
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="w-4 h-4 mr-2" />
              {totalQuantity > 0 && (
                <span className="ml-1 bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalQuantity}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        {/* MOBILE: layout a colonna singola — prima il configuratore, poi le opzioni */}
        {/* DESKTOP: grid 2 colonne */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT — Configuratore */}
          <div className="lg:sticky lg:top-20 lg:self-start">

            {/* Toggle fronte/retro + reset */}
            <div className="flex gap-2 mb-3">
              {(['front', 'back'] as const).map(s => (
                <button key={s} onClick={() => setCurrentSide(s)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    currentSide === s ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                  {s === 'front' ? '👕 Fronte' : '🔄 Retro'}
                </button>
              ))}
              <button onClick={() => { if(confirm('Cancellare il design?')) { window.dispatchEvent(new CustomEvent('resetCanvas')); toast.success('Design cancellato'); }}}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas o placeholder */}
            {mockupUrl ? (
              <CanvasEditor
                mockupUrl={mockupUrl}
                side={currentSide}
                productName={product.title}
                printArea={printAreas?.front ?? undefined}
                printAreaBack={printAreas?.back ?? undefined}
              />
            ) : (
              <div className="aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200">
                {selectedColor && !currentMockup ? (
                  <>
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                      style={{ backgroundColor: getColorHex(selectedColor) }} />
                    <p className="font-medium">{selectedColor}</p>
                    <p className="text-sm text-gray-400 text-center px-8">
                      Mockup non configurato.<br />
                      Vai su <code className="bg-gray-200 px-1 rounded text-xs">/admin/mockups</code>
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">Seleziona un colore per iniziare</p>
                )}
              </div>
            )}

            {/* Toolbar — solo su desktop, mobile è integrata nel CanvasEditor */}
            {!isMobile && selectedColor && mockupUrl && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  🎨 Personalizza — {currentSide === 'front' ? 'Fronte' : 'Retro'}
                </p>
                <Toolbar side={currentSide} />
              </div>
            )}
          </div>

          {/* RIGHT — Info prodotto + selezioni */}
          <div className="space-y-6">

            {/* Titolo e prezzo */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">€{(price * quantity).toFixed(2)}</span>
                {quantity > 1 && <span className="text-sm text-gray-400">(€{price.toFixed(2)} cad.)</span>}
              </div>
              <p className="text-sm text-gray-400 mt-1">IVA inclusa • Spedizione gratuita sopra €50</p>
            </div>

            {product.description && <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>}

            {/* Colore */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Colore</span>
                {selectedColor && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{selectedColor}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {uniqueColors.map(color => {
                  const hex = getColorHex(color);
                  const isLight = ['#F5F5F5','#F5F5DC','#FFD700','#ADD8E6','#98FFD0','#FFB6C1'].includes(hex);
                  return (
                    <button key={color} onClick={() => handleColorChange(color)} title={color}
                      className={`relative w-11 h-11 rounded-full transition-all duration-200 flex items-center justify-center ${
                        selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'ring-1 ring-gray-300 hover:scale-105'
                      }`} style={{ backgroundColor: hex }}>
                      {selectedColor === color && (
                        <Check className={`w-4 h-4 drop-shadow ${isLight ? 'text-gray-800' : 'text-white'}`} />
                      )}
                      {mockups[color] && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                🟢 mockup pronto &nbsp;·&nbsp; {Object.keys(mockups).length}/{uniqueColors.length} colori configurati
              </p>
            </div>

            {/* Taglia */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Taglia</span>
                <button className="text-sm text-gray-400 underline">Guida taglie</button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map(size => {
                  const ok = availableSizes.includes(size);
                  return (
                    <button key={size} onClick={() => ok && setSelectedSize(size)} disabled={!ok}
                      className={`py-3 text-sm font-medium rounded-xl border-2 transition-all ${
                        selectedSize === size ? 'border-gray-900 bg-gray-900 text-white'
                        : ok ? 'border-gray-200 hover:border-gray-400'
                        : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                      }`}>
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantità */}
            <div>
              <span className="font-semibold mb-3 block">Quantità</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-11 h-11 border-2 rounded-xl hover:bg-gray-50 font-bold text-xl">−</button>
                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(99, q + 1))}
                  className="w-11 h-11 border-2 rounded-xl hover:bg-gray-50 font-bold text-xl">+</button>
              </div>
            </div>

            {/* CTA */}
            <Button onClick={handleAddToCart} size="lg"
              className="w-full h-14 text-base font-bold bg-orange-600 hover:bg-orange-700 rounded-xl"
              disabled={!selectedColor || cartLoading || availableSizes.length === 0}>
              {cartLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aggiunta...</>
                : `🛒 Aggiungi al carrello — €${(price * quantity).toFixed(2)}`
              }
            </Button>

            {/* Features */}
            <div className="border-t pt-5 grid grid-cols-2 gap-2">
              {['⚡ Spedizione 24h','↩️ Reso 30 giorni','🖨️ Stampa HD','🌿 Cotone premium'].map(f => (
                <p key={f} className="text-sm text-gray-500">{f}</p>
              ))}
            </div>

            <details className="border-t pt-5">
              <summary className="cursor-pointer font-semibold flex items-center justify-between">
                Dettagli prodotto <ChevronDown className="w-5 h-5" />
              </summary>
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>• 100% cotone biologico · 180 g/m²</p>
                <p>• Stampa DTG (Direct to Garment)</p>
                <p>• Lavaggio max 30°C, non asciugare in asciugatrice</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
