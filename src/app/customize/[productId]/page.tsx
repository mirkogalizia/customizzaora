'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, getColors } from '@/lib/firebase/products';
import { Product, Color } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CanvasEditor } from '@/components/customizer/CanvasEditor';
import { Toolbar } from '@/components/customizer/Toolbar';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Loader2, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [quantity, setQuantity] = useState(1);

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

      const colorsData = await getColors(productId);
      setColors(colorsData);
      if (colorsData.length > 0) {
        setSelectedColor(colorsData[0]);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedColor) {
      toast.error('Seleziona un colore');
      return;
    }
    toast.success('✅ Aggiunto al carrello!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const currentMockup = selectedColor
    ? (currentSide === 'front' ? selectedColor.mockupFront : selectedColor.mockupBack)
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Indietro
              </Button>
            </Link>
            <Link href="/" className="text-xl font-bold text-orange-600">
              Print Shop
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrello
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Layout 50/50 Desktop, Stack Mobile */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: Canvas Editor + Mockup */}
          <div className="space-y-4">
            {/* Side Tabs */}
            <div className="flex gap-2 border-b pb-3">
              <button
                onClick={() => setCurrentSide('front')}
                className={`flex-1 py-3 px-4 rounded-t-lg font-semibold transition-all ${
                  currentSide === 'front'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Fronte
              </button>
              <button
                onClick={() => setCurrentSide('back')}
                className={`flex-1 py-3 px-4 rounded-t-lg font-semibold transition-all ${
                  currentSide === 'back'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Retro
              </button>
            </div>

            {/* Canvas con Mockup - FIX RESPONSIVE */}
            {selectedColor && currentMockup ? (
              <div className="lg:sticky lg:top-24">
                {/* Container con aspect ratio fisso */}
                <div className="w-full max-w-full mx-auto">
                  <div className="relative w-full" style={{ paddingTop: '120%' }}>
                    {/* Aspect ratio 5:6 (600x700) */}
                    <div className="absolute inset-0">
                      <CanvasEditor
                        mockupUrl={currentMockup}
                        side={currentSide}
                        productName={product.name}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Seleziona un colore</p>
              </div>
            )}
          </div>

          {/* RIGHT: Product Info + Options */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">{product.name}</h1>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-orange-600">
                  €{product.basePrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">IVA inclusa</span>
              </div>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Toolbar - Editor */}
            {selectedColor && (
              <Card className="p-5 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  🎨 Personalizza il tuo design
                </h3>
                <Toolbar side={currentSide} />
              </Card>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3">Colore</h3>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      className={`relative group`}
                      title={color.name}
                    >
                      <div
                        className={`w-14 h-14 rounded-full border-4 transition-all ${
                          selectedColor?.id === color.id
                            ? 'border-orange-600 scale-110 shadow-lg'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {selectedColor?.id === color.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-center block mt-1 font-medium">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div>
              <h3 className="font-bold text-lg mb-3">Taglia</h3>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 px-2 rounded-lg font-bold transition-all ${
                      selectedSize === size
                        ? 'bg-orange-600 text-white ring-2 ring-orange-600 ring-offset-2'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-bold text-lg mb-3">Quantità</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold"
                >
                  -
                </button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full h-14 text-lg font-bold"
              disabled={!selectedColor}
            >
              <ShoppingCart className="w-5 h-5 mr-3" />
              Aggiungi al Carrello - €{(product.basePrice * quantity).toFixed(2)}
            </Button>

            {/* Info Cards */}
            <div className="space-y-3">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Spedizione Gratuita</p>
                    <p className="text-sm text-green-700">Per ordini sopra €50</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Qualità Garantita</p>
                    <p className="text-sm text-blue-700">Stampa HD, tessuto premium</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Features List */}
            <div className="border-t pt-6">
              <h4 className="font-bold mb-3">Caratteristiche</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Tessuto 100% cotone premium
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Stampa digitale ad alta definizione
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Spedizione in 3-5 giorni lavorativi
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Reso gratuito entro 30 giorni
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
