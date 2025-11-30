'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/firebase/products';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, ShirtIcon, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { 
    id: 'all', 
    name: 'Tutti i Prodotti', 
    icon: '🎨',
    description: 'Vedi tutto il catalogo'
  },
  { 
    id: 'tshirt', 
    name: 'T-Shirt', 
    icon: '👕',
    description: 'Classiche e comode'
  },
  { 
    id: 'hoodie', 
    name: 'Felpe con Cappuccio', 
    icon: '🧥',
    description: 'Calde e trendy'
  },
  { 
    id: 'sweatshirt', 
    name: 'Sweatshirt', 
    icon: '👔',
    description: 'Casual e versatili'
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      // Filtra solo prodotti attivi
      const activeProducts = data.filter(p => p.isActive);
      setProducts(activeProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <ShirtIcon className="w-6 h-6 text-orange-600" />
              <span className="text-xl font-bold">Print<span className="text-orange-600">Shop</span></span>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrello
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO MINI */}
      <section className="bg-gradient-to-br from-orange-50 to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Scegli il Tuo Prodotto
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tutti i prezzi includono <strong>fronte, retro e 4 colori</strong> di stampa. 
            Spedizione gratuita sopra €50.
          </p>
        </div>
      </section>

      {/* FILTRI CATEGORIE */}
      <section className="bg-white border-b sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedCategory === category.id
                    ? 'border-orange-600 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
                }`}
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <div className={`font-bold mb-1 ${
                  selectedCategory === category.id ? 'text-orange-600' : 'text-gray-900'
                }`}>
                  {category.name}
                </div>
                <div className="text-sm text-gray-600">{category.description}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-medium">Consegna in 24 ore</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span className="font-medium">Prezzo tutto incluso</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <span className="font-medium">Fronte + Retro + 4 Colori</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="font-medium">Qualità garantita</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRODOTTI */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Nessun prodotto trovato
              </h3>
              <p className="text-gray-600 mb-6">
                Non ci sono prodotti in questa categoria al momento.
              </p>
              <Button onClick={() => setSelectedCategory('all')}>
                Vedi Tutti i Prodotti
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory === 'all' 
                    ? `Tutti i Prodotti (${filteredProducts.length})` 
                    : `${CATEGORIES.find(c => c.id === selectedCategory)?.name} (${filteredProducts.length})`
                  }
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 group border-2 hover:border-orange-200">
                    <Link href={`/products/${product.id}`}>
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        {product.mainImage ? (
                          <img
                            src={product.mainImage}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShirtIcon className="w-24 h-24 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Badge Categoria */}
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-md">
                          {CATEGORIES.find(c => c.id === product.category)?.icon} {CATEGORIES.find(c => c.id === product.category)?.name}
                        </div>

                        {/* Badge 24h */}
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          ⚡ 24h
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {product.name}
                        </h3>
                        
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-3xl font-bold text-orange-600">
                              €{product.basePrice.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Fronte + Retro inclusi
                            </div>
                          </div>
                          
                          <Button className="group-hover:bg-orange-600 group-hover:shadow-lg transition-all">
                            Personalizza
                          </Button>
                        </div>

                        {/* Features */}
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="text-green-600">✓</span>
                            <span>Fronte + Retro + 4 Colori</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="text-green-600">✓</span>
                            <span>Consegna in 24 ore</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="text-green-600">✓</span>
                            <span>100% Cotone Premium</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section className="py-16 bg-gradient-to-br from-orange-600 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Non Trovi Quello Che Cerchi?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Contattaci su WhatsApp e creeremo insieme il prodotto perfetto per te!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-12 px-8 font-semibold">
              💬 Contattaci su WhatsApp
            </Button>
            <Link href="/quick-order">
              <Button size="lg" variant="outline" className="h-12 px-8 font-semibold border-white text-white hover:bg-white hover:text-orange-600">
                Ordine Veloce
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShirtIcon className="w-6 h-6 text-orange-600" />
            <span className="text-xl font-bold text-white">PrintShop</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Magliette personalizzate di qualità, consegnate in 24 ore.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/how-it-works" className="hover:text-orange-600">Come Funziona</Link>
            <Link href="/faq" className="hover:text-orange-600">FAQ</Link>
            <Link href="/contact" className="hover:text-orange-600">Contatti</Link>
            <Link href="/shipping" className="hover:text-orange-600">Spedizioni</Link>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400">
            <p>© 2025 PrintShop. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

