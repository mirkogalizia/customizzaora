'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { createProduct, updateProduct } from '@/lib/firebase/products';
import { uploadProductImage } from '@/lib/firebase/storage';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';

export function ProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'tshirt' as const,
    basePrice: 0,
    isActive: true,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setMainImage(null);
    setMainImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🎨 Creating product...');
      
      const productId = await createProduct(formData);
      console.log('✅ Product created with ID:', productId);
      
      if (mainImage) {
        console.log('📤 Uploading main image...');
        const mainImageUrl = await uploadProductImage(mainImage, productId, 'main');
        console.log('✅ Image uploaded:', mainImageUrl);
        
        await updateProduct(productId, { mainImage: mainImageUrl });
        console.log('✅ Product updated with image');
      }
      
      toast.success('Prodotto creato con successo!');
      router.push(`/admin/products/${productId}`);
    } catch (error: any) {
      console.error('❌ Error creating product:', error);
      toast.error(`Errore: ${error.message || 'Errore durante la creazione'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Nome Prodotto *</Label>
          <Input
            placeholder="T-Shirt Basic"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            minLength={2}
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
          <Label>Categoria *</Label>
          <select
            className="w-full p-3 border rounded-md"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            required
          >
            <option value="tshirt">T-Shirt</option>
            <option value="hoodie">Felpa con Cappuccio</option>
            <option value="sweatshirt">Felpa</option>
          </select>
        </div>

        <div>
          <Label>Prezzo Base (€) *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div>
          <Label>Immagine Principale (opzionale)</Label>
          <p className="text-sm text-gray-600 mb-2">Questa immagine apparirà nella lista prodotti</p>
          
          {mainImagePreview ? (
            <div className="relative inline-block">
              <img
                src={mainImagePreview}
                alt="Preview"
                className="w-48 h-48 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="main-image"
              />
              <label htmlFor="main-image">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600">Clicca per caricare un'immagine</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG fino a 10MB</p>
                </div>
              </label>
            </div>
          )}
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creazione in corso...' : 'Crea Prodotto'}
        </Button>
      </form>
    </Card>
  );
}

