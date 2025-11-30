'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProduct, updateProduct, deleteProduct, getColors } from '@/lib/firebase/products';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ColorManager } from '@/components/admin/ColorManager';
import { ProductImageManager } from '@/components/admin/ProductImageManager';
import { PrintAreaDraggable } from '@/components/admin/PrintAreaDraggable';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

type ProductCategory = 'tshirt' | 'hoodie' | 'sweatshirt';

export default function ProductDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [colors, setColors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'colors' | 'printAreas'>('details');
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: ProductCategory;
    basePrice: number;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    category: 'tshirt',
    basePrice: 0,
    isActive: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && productId) {
      loadProduct();
    }
  }, [user, productId]);

  const loadProduct = async () => {
    try {
      const data = await getProduct(productId);
      if (data) {
        setProduct(data);
        setFormData({
          name: data.name,
          description: data.description,
          category: data.category,
          basePrice: data.basePrice,
          isActive: data.isActive,
        });

        const colorsData = await getColors(productId);
        setColors(colorsData);
      } else {
        toast.error('Prodotto non trovato');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Errore nel caricamento del prodotto');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProduct(productId, formData);
      toast.success('Prodotto aggiornato con successo!');
      loadProduct();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Errore durante l\'aggiornamento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

    try {
      await deleteProduct(productId);
      toast.success('Prodotto eliminato');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  if (!user || !product) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{product.name}</h1>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Elimina
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Dettagli Prodotto
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`pb-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'images'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Immagini
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`pb-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'colors'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Colori e Varianti
          </button>
          <button
            onClick={() => setActiveTab('printAreas')}
            className={`pb-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'printAreas'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Aree di Stampa
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <Label>Nome Prodotto</Label>
                  <Input
                    placeholder="T-Shirt Basic"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Descrizione</Label>
                  <textarea
                    className="w-full min-h-[100px] p-3 border rounded-md"
                    placeholder="Descrivi il prodotto..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Categoria</Label>
                  <select
                    className="w-full p-3 border rounded-md"
                    value={formData.category}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      category: e.target.value as ProductCategory
                    })}
                  >
                    <option value="tshirt">T-Shirt</option>
                    <option value="hoodie">Felpa con Cappuccio</option>
                    <option value="sweatshirt">Felpa</option>
                  </select>
                </div>

                <div>
                  <Label>Prezzo Base (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isActive">Prodotto attivo</Label>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Informazioni</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span>
                  <p className="font-mono text-xs break-all mt-1">{product.id}</p>
                </div>
                <div>
                  <span className="text-gray-600">Creato:</span>
                  <p>{new Date(product.createdAt).toLocaleDateString('it-IT')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Aggiornato:</span>
                  <p>{new Date(product.updatedAt).toLocaleDateString('it-IT')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Guida Setup</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-start">
                  <span className="font-bold text-orange-600 mr-2">1.</span>
                  Compila i dettagli del prodotto
                </p>
                <p className="flex items-start">
                  <span className="font-bold text-orange-600 mr-2">2.</span>
                  Carica immagini e mockup
                </p>
                <p className="flex items-start">
                  <span className="font-bold text-orange-600 mr-2">3.</span>
                  Aggiungi colori e varianti
                </p>
                <p className="flex items-start">
                  <span className="font-bold text-orange-600 mr-2">4.</span>
                  Imposta area di stampa trascinabile
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'images' && (
        <ProductImageManager
          productId={productId}
          mainImage={product.mainImage}
          images={product.images}
          onUpdate={loadProduct}
        />
      )}

      {activeTab === 'colors' && (
        <ColorManager productId={productId} />
      )}

      {activeTab === 'printAreas' && (
        <PrintAreaDraggable
          productId={productId}
          frontMockup={colors[0]?.mockupFront}
          backMockup={colors[0]?.mockupBack}
          currentPrintAreas={product.printAreas}
          onUpdate={loadProduct}
        />
      )}
    </div>
  );
}
