'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getShopifyProduct, findVariantId, ShopifyProduct } from '@/lib/shopify/storefront';
import { getProductMockups, ColorMockup } from '@/lib/firebase/mockups';
import { Button } from '@/components/ui/button';
import { CanvasEditor } from '@/components/customizer/CanvasEditor';
import { Toolbar } from '@/components/customizer/Toolbar';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Loader2, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Shopify numeric ID per caricare mockup da Firebase
const HANDLE_TO_SHOPIFY_ID: Record<string, string> = {
  'tshirt-personalizzata-spedizione-24h': '15409340350789',
  'felpa-personalizzata-spedizione-24h': '15598323237189',
  'girocollo-personalizzata-spedizione-24h': '15598448148805',
};

// Hex di fallback per swatch — se il mockup ha il colore hex reale lo usiamo invece
const FALLBACK_HEX: Record<string, string> = {
  'Black': '#111111',
  'White': '#F5F5F5',
  'Navy': '#1B2A4A',
  'Indigo': '#4B0082',
  'Light Blue': '#ADD8E6',
  'Mint': '#98FFD0',
  'Forest Green': '#228B22',
  'Purple': '#800080',
  'Red': '#CC0000',
  'Grey': '#888888',
  'Gray': '#888888',
  'Yellow': '#FFD700',
  'Orange': '#FF6600',
  'Pink': '#FFB6C1',
  'Brown': '#8B4513',
  'Beige': '#F5F5DC',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.id as string;
  const { addItem, loading: cartLoading, totalQuantity } = useCart();

  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [mockups, setMockups] = useState<Record<string, ColorMockup>>({});
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => { loadProduct(); }, [handle]);

  const loadProduct = async () => {
    try {
      const sp = await getShopifyProduct(handle);
      if (!sp) {
        toast.error('Prodotto non trovato');
        router.push('/products');
        return;
      }
      setProduct(sp);

      // Primo colore disponibile come default
      const colors = getUniqueColors(sp);
      if (colors.length > 0) setSelectedColor(colors[0]);

      // Carica mockup da Firebase
      const shopifyId = HANDLE_TO_SHOPIFY_ID[handle];
      if (shopifyId) {
        const saved = await getProductMockups(shopifyId);
        if (saved?.colors) setMockups(saved.colors);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  // Estrae colori unici mantenendo l'ordine di Shopify
  function getUniqueColors(sp: ShopifyProduct): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const { node } of sp.variants.edges) {
      const colorOpt = node.selectedOptions.find(o => o.name === 'Color');
      if (colorOpt && !seen.has(colorOpt.value)) {
        seen.add(colorOpt.value);
        result.push(colorOpt.value);
      }
    }
    return result;
  }

  // Taglie disponibili per il colore selezionato
  function getAvailableSizes(sp: ShopifyProduct, color: string): string[] {
    return sp.variants.edges
      .filter(({ node }) => {
        const colorOpt = node.selectedOptions.find(o => o.name === 'Color');
        return colorOpt?.value === color && node.availableForSale;
      })
      .map(({ node }) => node.selectedOptions.find(o => o.name === 'Size')?.value ?? '')
      .filter(Boolean);
  }

  const uniqueColors = product ? getUniqueColors(product) : [];
  const availableSizes = product && selectedColor ? getAvailableSizes(product, selectedColor) : [];

  // Mockup del colore selezionato
  const currentMockup = selectedColor ? mockups[selectedColor] : null;
  const mockupUrl = currentMockup
    ? (currentSide === 'front' ? currentMockup.mockupFront : currentMockup.mockupBack)
    : null;

  const price = product ? parseFloat(product.priceRange.minVariantPrice.amount) : 0;

  // Colore hex: usa quello salvato nel mockup Firebase, altrimenti fallback
  function getColorHex(colorName: string): string {
    const fromMockup = mockups[colorName]?.colorHex;
    if (fromMockup && fromMockup !== '#000000') return fromMockup;
    // Cerca case-insensitive nel fallback
    const key = Object.keys(FALLBACK_HEX).find(k => k.toLowerCase() === colorName.toLowerCase());
    return key ? FALLBACK_HEX[key] : '#CCCCCC';
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setCurrentSide('front'); // reset al fronte quando cambia colore
    // Se la taglia corrente non è disponibile per il nuovo colore, seleziona la prima disponibile
    if (product) {
      const sizes = getAvailableSizes(product, color);
      if (sizes.length > 0 && !sizes.includes(selectedSize)) {
        setSelectedSize(sizes[0]);
      }
    }
  };

  const handleResetDesign = () => {
    if (confirm('Vuoi cancellare tutto il design?')) {
      window.dispatchEvent(new CustomEvent('resetCanvas'));
      toast.success('Design resettato');
    }
  };

  const handleAddToCart = async () => {
    if (!selectedColor) { toast.error('Seleziona un colore'); return; }
    if (!product) return;

    try {
      const fabricCanvas = (window as any).fabricCanvas;
      const previewUrl = fabricCanvas
        ? fabricCanvas.toDataURL({ format: 'png', quality: 0.7 })
        : null;

      const variantId = findVariantId(product, selectedColor, selectedSize);
      if (!variantId) {
        toast.error(`Variante ${selectedColor} / ${selectedSize} non disponibile`);
        return;
      }

      const attributes: { key: string; value: string }[] = [
        { key: 'colore', value: selectedColor },
        { key: 'colore_hex', value: getColorHex(selectedColor) },
        { key: 'taglia', value: selectedSize },
        { key: 'handle', value: handle },
      ];
      if (previewUrl) attributes.push({ key: 'preview_url', value: previewUrl });

      await addItem(variantId, quantity, attributes);
      toast.success('✅ Aggiunto al carrello!');
    } catch (err: any) {
      toast.error(err.message || 'Errore aggiunta al carrello');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />Catalogo
              </Button>
            </Link>
            <Link href="/" className="text-xl font-bold text-orange-600">Print Shop</Link>
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />Carrello
                {totalQuantity > 0 && (
                  <span className="ml-1 bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {totalQuantity}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT — Canvas */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {/* Toggle fronte/retro */}
            <div className="flex gap-2 mb-4">
              {(['front', 'back'] as const).map(side => (
                <button
                  key={side}
                  onClick={() => setCurrentSide(side)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                    currentSide === side ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {side === 'front' ? '👕 Fronte' : '🔄 Retro'}
                </button>
              ))}
              <button
                onClick={handleResetDesign}
                className="px-4 py-2.5 text-sm font-medium rounded-md bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                title="Cancella design"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas o placeholder */}
            {mockupUrl ? (
              <CanvasEditor
                mockupUrl={mockupUrl}
                side={currentSide}
                productName={product.title}
                printArea={currentMockup?.printArea}
              />
            ) : (
              <div className="aspect-square bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300">
                {selectedColor && !currentMockup ? (
                  <>
                    <div
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                      style={{ backgroundColor: getColorHex(selectedColor) }}
                    />
                    <p className="font-medium text-gray-700">{selectedColor}</p>
                    <p className="text-sm text-gray-400 text-center px-8">
                      Mockup non ancora caricato.<br />
                      Vai su <code className="bg-gray-200 px-1 rounded text-xs">/admin/mockups</code> per configurarlo.
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">Seleziona un colore per iniziare</p>
                )}
              </div>
            )}

            {/* Toolbar editor — sotto il canvas */}
            {selectedColor && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  🎨 Personalizza il design — {currentSide === 'front' ? 'Fronte' : 'Retro'}
                </p>
                <Toolbar side={currentSide} />
              </div>
            )}
          </div>

          {/* RIGHT — Info prodotto */}
          <div className="space-y-7">
            {/* Titolo e prezzo */}
            <div>
              <h1 className="text-3xl font-bold mb-3">{product.title}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">
                  €{(price * quantity).toFixed(2)}
                </span>
                {quantity > 1 && (
                  <span className="text-sm text-gray-500">(€{price.toFixed(2)} cad.)</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">IVA inclusa • Spedizione gratuita sopra €50</p>
            </div>

            {product.description && (
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {/* Selezione COLORE */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Colore</span>
                {selectedColor && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedColor}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {uniqueColors.map((color) => {
                  const hex = getColorHex(color);
                  const isLight = hex === '#F5F5F5' || hex === '#F5F5DC' || hex === '#FFD700' || hex === '#ADD8E6' || hex === '#98FFD0' || hex === '#FFB6C1';
                  const hasMockup = !!mockups[color];
                  return (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      title={color}
                      className={`relative w-11 h-11 rounded-full transition-all duration-200 flex items-center justify-center ${
                        selectedColor === color
                          ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                          : 'ring-1 ring-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {selectedColor === color && (
                        <Check className={`w-4 h-4 drop-shadow ${isLight ? 'text-gray-800' : 'text-white'}`} />
                      )}
                      {/* Pallino verde se mockup configurato */}
                      {hasMockup && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                🟢 = mockup configurato &nbsp;|&nbsp; {Object.keys(mockups).length}/{uniqueColors.length} colori pronti
              </p>
            </div>

            {/* Selezione TAGLIA */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Taglia</span>
                <button className="text-sm text-gray-500 underline">Guida taglie</button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map((size) => {
                  const isAvailable = availableSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => isAvailable && setSelectedSize(size)}
                      disabled={!isAvailable}
                      className={`py-3 text-sm font-medium rounded-md border-2 transition-all ${
                        selectedSize === size
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : isAvailable
                          ? 'border-gray-300 hover:border-gray-500'
                          : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUANTITÀ */}
            <div>
              <span className="font-semibold mb-3 block">Quantità</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-bold text-lg"
                >−</button>
                <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-bold text-lg"
                >+</button>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full h-14 text-base font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={!selectedColor || cartLoading || availableSizes.length === 0}
            >
              {cartLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aggiunta...</>
                : `🛒 Aggiungi al carrello — €${(price * quantity).toFixed(2)}`
              }
            </Button>

            {/* Features */}
            <div className="border-t pt-5 space-y-2.5">
              {[
                '⚡ Spedizione in 24 ore',
                '↩️ Reso gratuito entro 30 giorni',
                '🖨️ Stampa HD di alta qualità',
                '🌿 Tessuto 100% cotone premium',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <details className="border-t pt-5">
              <summary className="cursor-pointer font-semibold flex items-center justify-between">
                Dettagli prodotto <ChevronDown className="w-5 h-5" />
              </summary>
              <div className="mt-4 text-sm text-gray-600 space-y-1.5">
                <p>• Materiale: 100% cotone biologico</p>
                <p>• Grammatura: 180 g/m²</p>
                <p>• Stampa: DTG (Direct to Garment)</p>
                <p>• Lavaggio: Max 30°C</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
