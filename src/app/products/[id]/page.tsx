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

// Shopify numeric ID per ogni handle — serve per caricare mockup da Firebase
const HANDLE_TO_SHOPIFY_ID: Record<string, string> = {
  'tshirt-personalizzata-spedizione-24h': '15409340350789',
  'felpa-personalizzata-spedizione-24h': '15598323237189',
  'girocollo-personalizzata-spedizione-24h': '15598448148805',
};

// Hex approssimativi per gli swatch colore
const COLOR_HEX: Record<string, string> = {
  'Black': '#111111',
  'White': '#FFFFFF',
  'Navy': '#1B2A4A',
  'Indigo': '#4B0082',
  'Light Blue': '#ADD8E6',
  'Mint': '#98FFD0',
  'Forest Green': '#228B22',
  'Purple': '#800080',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.id as string; // è l'handle Shopify es. "tshirt-personalizzata-spedizione-24h"
  const { addItem, loading: cartLoading, totalQuantity } = useCart();

  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [mockups, setMockups] = useState<Record<string, ColorMockup>>({});
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [quantity, setQuantity] = useState(1);
  const [showEditor, setShowEditor] = useState(true);

  useEffect(() => { loadProduct(); }, [handle]);

  const loadProduct = async () => {
    try {
      // Carica da Shopify usando l'handle
      const sp = await getShopifyProduct(handle);
      if (!sp) {
        toast.error('Prodotto non trovato');
        router.push('/products');
        return;
      }
      setProduct(sp);

      // Primo colore disponibile come default
      const firstColor = sp.variants.edges[0]?.node.selectedOptions
        .find(o => o.name === 'Color')?.value ?? null;
      setSelectedColor(firstColor);

      // Carica mockup da Firebase (se già configurati dall'admin)
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

  // Colori unici dalle varianti Shopify (es. Black, White, Navy...)
  const uniqueColors = product
    ? [...new Set(
        product.variants.edges
          .map(e => e.node.selectedOptions.find(o => o.name === 'Color')?.value)
          .filter((c): c is string => Boolean(c))
      )]
    : [];

  const currentMockup = selectedColor ? mockups[selectedColor] : null;
  const mockupUrl = currentMockup
    ? (currentSide === 'front' ? currentMockup.mockupFront : currentMockup.mockupBack)
    : null;
  const price = product ? parseFloat(product.priceRange.minVariantPrice.amount) : 0;

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
        { key: 'colore_hex', value: COLOR_HEX[selectedColor] ?? '#000000' },
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

          {/* LEFT — Canvas editor */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex gap-2 mb-4">
              {(['front', 'back'] as const).map(side => (
                <button
                  key={side}
                  onClick={() => setCurrentSide(side)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                    currentSide === side ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {side === 'front' ? 'Fronte' : 'Retro'}
                </button>
              ))}
              <button
                onClick={handleResetDesign}
                className="px-4 py-2.5 text-sm font-medium rounded-md bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                title="Reset design"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {mockupUrl ? (
              <CanvasEditor
                mockupUrl={mockupUrl}
                side={currentSide}
                productName={product.title}
                printArea={currentMockup?.printArea}
              />
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2 text-center p-8">
                {selectedColor && !currentMockup ? (
                  <>
                    <p className="text-gray-500 font-medium">Mockup non ancora configurato</p>
                    <p className="text-sm text-gray-400">Vai su <code className="bg-gray-200 px-1 rounded">/admin/mockups</code> per caricare le immagini</p>
                  </>
                ) : (
                  <p className="text-gray-400">Seleziona un colore per iniziare</p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Info + configurazione */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <div className="text-2xl font-semibold">
                €{(price * quantity).toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 mt-1">IVA inclusa • Spedizione gratuita sopra €50</p>
            </div>

            {product.description && (
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            )}

            {/* Selezione colore */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Colore</span>
                {selectedColor && <span className="text-sm text-gray-600">{selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                      selectedColor === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: COLOR_HEX[color] ?? '#ccc' }}
                    title={color}
                  >
                    {selectedColor === color && (
                      <Check className={`w-5 h-5 drop-shadow ${color === 'White' ? 'text-gray-800' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Selezione taglia */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Taglia</span>
                <button className="text-sm text-gray-600 underline">Guida taglie</button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-medium rounded-md border-2 transition-all ${
                      selectedSize === size
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbar personalizzazione */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">🎨 Personalizza il tuo design</span>
                <button onClick={() => setShowEditor(!showEditor)} className="text-sm text-gray-600 underline">
                  {showEditor ? 'Nascondi' : 'Mostra'}
                </button>
              </div>
              {showEditor && selectedColor && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <Toolbar side={currentSide} />
                </div>
              )}
            </div>

            {/* Quantità */}
            <div>
              <span className="text-sm font-medium mb-3 block">Quantità</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-bold text-lg">−</button>
                <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(99, quantity + 1))} className="w-10 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-bold text-lg">+</button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full h-12 text-base font-medium"
              disabled={!selectedColor || cartLoading}
            >
              {cartLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aggiunta...</>
                : `Aggiungi al carrello • €${(price * quantity).toFixed(2)}`
              }
            </Button>

            {/* Features */}
            <div className="border-t pt-6 space-y-3">
              {[
                'Spedizione gratuita sopra €50',
                'Reso gratuito entro 30 giorni',
                'Stampa HD di alta qualità',
                'Tessuto 100% cotone premium',
              ].map(f => (
                <div key={f} className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <details className="border-t pt-6">
              <summary className="cursor-pointer font-medium flex items-center justify-between">
                Dettagli prodotto <ChevronDown className="w-5 h-5" />
              </summary>
              <div className="mt-4 text-sm text-gray-600 space-y-2">
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
