'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, getColors } from '@/lib/firebase/products';
import { Product, Color } from '@/types';
import { Button } from '@/components/ui/button';
import { CanvasEditor } from '@/components/customizer/CanvasEditor';
import { Toolbar } from '@/components/customizer/Toolbar';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Loader2, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { getShopifyProduct, findVariantId, ShopifyProduct } from '@/lib/shopify/storefront';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Mappa categoria Firebase → handle prodotto Shopify
const SHOPIFY_HANDLE_MAP: Record<string, string> = {
  'tshirt': 'tshirt-personalizzata-spedizione-24h',
  'hoodie': 'felpa-personalizzata-spedizione-24h',
  'sweatshirt': 'girocollo-personalizzata-spedizione-24h',
};

// Mappa nome colore Firebase → nome colore Shopify
// Verifica che i nomi corrispondano esattamente a quelli nelle varianti Shopify
const COLOR_NAME_MAP: Record<string, string> = {
  'nero': 'Black',
  'bianco': 'White',
  'blu navy': 'Navy',
  'navy': 'Navy',
  'indaco': 'Indigo',
  'indigo': 'Indigo',
  'azzurro': 'Light Blue',
  'light blue': 'Light Blue',
  'menta': 'Mint',
  'mint': 'Mint',
  'verde': 'Forest Green',
  'forest green': 'Forest Green',
  'viola': 'Purple',
  'purple': 'Purple',
};

function normalizeColorName(name: string): string {
  return COLOR_NAME_MAP[name.toLowerCase()] ?? name;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { addItem, loading: cartLoading, totalQuantity } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopifyProduct, setShopifyProduct] = useState<ShopifyProduct | null>(null);

  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [quantity, setQuantity] = useState(1);
  const [showEditor, setShowEditor] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const productData = await getProduct(productId);
      if (!productData) {
        toast.error('Prodotto non trovato');
        router.push('/products');
        return;
      }

      setProduct(productData);

      // Carica colori da Firebase
      const colorsData = await getColors(productId);
      setColors(colorsData);
      if (colorsData.length > 0) setSelectedColor(colorsData[0]);

      // Carica prodotto da Shopify in parallelo
      const handle = SHOPIFY_HANDLE_MAP[productData.category];
      if (handle) {
        try {
          const sp = await getShopifyProduct(handle);
          setShopifyProduct(sp);
        } catch (err) {
          console.warn('Shopify product not loaded:', err);
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDesign = () => {
    if (confirm('Vuoi cancellare tutto il design?')) {
      window.dispatchEvent(new CustomEvent('resetCanvas'));
      toast.success('Design resettato');
    }
  };

  const handleAddToCart = async () => {
    if (!selectedColor) {
      toast.error('Seleziona un colore');
      return;
    }

    if (!shopifyProduct) {
      toast.error('Prodotto Shopify non disponibile, riprova');
      return;
    }

    try {
      // 1. Esporta preview dal canvas
      const fabricCanvas = (window as any).fabricCanvas;
      const previewUrl = fabricCanvas
        ? fabricCanvas.toDataURL({ format: 'png', quality: 0.7 })
        : null;

      // 2. Trova variantId Shopify da colore + taglia
      const shopifyColorName = normalizeColorName(selectedColor.name);
      const variantId = findVariantId(shopifyProduct, shopifyColorName, selectedSize);

      if (!variantId) {
        toast.error(`Variante "${shopifyColorName} / ${selectedSize}" non trovata su Shopify`);
        console.warn('Available variants:', shopifyProduct.variants.edges.map(e => e.node.title));
        return;
      }

      // 3. Attributi custom — visibili nell'ordine Shopify admin
      const attributes: { key: string; value: string }[] = [
        { key: 'colore', value: selectedColor.name },
        { key: 'colore_hex', value: selectedColor.hex },
        { key: 'taglia', value: selectedSize },
        { key: 'prodotto_firebase_id', value: product!.id },
        { key: 'quantita', value: String(quantity) },
      ];
      if (previewUrl) {
        attributes.push({ key: 'preview_url', value: previewUrl });
      }

      // 4. Aggiunge al carrello Shopify
      await addItem(variantId, quantity, attributes);
      toast.success('✅ Aggiunto al carrello!');

    } catch (err: any) {
      console.error('Add to cart error:', err);
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

  const currentMockup = selectedColor
    ? (currentSide === 'front' ? selectedColor.mockupFront : selectedColor.mockupBack)
    : null;

  const isAddToCartDisabled = !selectedColor || cartLoading || !shopifyProduct;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Catalogo
              </Button>
            </Link>
            <Link href="/" className="text-xl font-bold text-orange-600">
              Print Shop
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrello
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT - Canvas */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCurrentSide('front')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  currentSide === 'front' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Fronte
              </button>
              <button
                onClick={() => setCurrentSide('back')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  currentSide === 'back' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Retro
              </button>
              <button
                onClick={handleResetDesign}
                className="px-4 py-2.5 text-sm font-medium rounded-md bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                title="Reset design"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {selectedColor && currentMockup ? (
              <CanvasEditor
                mockupUrl={currentMockup}
                side={currentSide}
                productName={product.name}
                printArea={product.printAreas?.[currentSide]}
              />
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Seleziona un colore</p>
              </div>
            )}

            {/* Shopify status badge */}
            <div className="mt-2 text-xs">
              {shopifyProduct ? (
                <span className="text-green-600">✓ Collegato a Shopify</span>
              ) : (
                <span className="text-amber-500">⏳ Caricamento Shopify...</span>
              )}
            </div>
          </div>

          {/* RIGHT - Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="text-2xl font-semibold">
                €{(product.basePrice * quantity).toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 mt-1">IVA inclusa • Spedizione gratuita</p>
            </div>

            <p className="text-gray-700 leading-relaxed">{product.description}</p>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Colore</span>
                  {selectedColor && (
                    <span className="text-sm text-gray-600">{selectedColor.name}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${
                        selectedColor?.id === color.id
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor?.id === color.id && (
                        <Check className="w-5 h-5 text-white mx-auto drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
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

            {/* Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">🎨 Personalizza il tuo design</span>
                <button
                  onClick={() => setShowEditor(!showEditor)}
                  className="text-sm text-gray-600 underline"
                >
                  {showEditor ? 'Nascondi' : 'Mostra'}
                </button>
              </div>
              {showEditor && selectedColor && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <Toolbar side={currentSide} />
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <span className="text-sm font-medium mb-3 block">Quantità</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-bold"
                >
                  −
                </button>
                <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full h-12 text-base font-medium"
              disabled={isAddToCartDisabled}
            >
              {cartLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aggiunta in corso...</>
                : `Aggiungi al carrello • €${(product.basePrice * quantity).toFixed(2)}`
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
                Dettagli prodotto
                <ChevronDown className="w-5 h-5" />
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

