'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { uploadProductImage } from '@/lib/firebase/storage';
import { updateProduct } from '@/lib/firebase/products';
import { toast } from 'sonner';
import { Upload, X, Star } from 'lucide-react';

interface ProductImageManagerProps {
  productId: string;
  mainImage?: string;
  images?: string[];
  onUpdate: () => void;
}

export function ProductImageManager({ 
  productId, 
  mainImage, 
  images = [],
  onUpdate 
}: ProductImageManagerProps) {
  const [uploading, setUploading] = useState(false);

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadProductImage(file, productId, 'main');
      await updateProduct(productId, { mainImage: imageUrl });
      toast.success('Immagine principale aggiornata!');
      onUpdate();
    } catch (error) {
      console.error('Error uploading main image:', error);
      toast.error('Errore durante l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        uploadProductImage(file, productId, 'gallery')
      );
      
      const newImageUrls = await Promise.all(uploadPromises);
      const updatedImages = [...images, ...newImageUrls];
      
      await updateProduct(productId, { images: updatedImages });
      toast.success(`${files.length} immagini aggiunte!`);
      onUpdate();
    } catch (error) {
      console.error('Error uploading gallery images:', error);
      toast.error('Errore durante l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSetAsMain = async (imageUrl: string) => {
    try {
      await updateProduct(productId, { mainImage: imageUrl });
      toast.success('Immagine principale aggiornata!');
      onUpdate();
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const handleRemoveImage = async (imageUrl: string, isMain: boolean = false) => {
    if (!confirm('Eliminare questa immagine?')) return;

    try {
      if (isMain) {
        await updateProduct(productId, { mainImage: undefined });
      } else {
        const updatedImages = images.filter(img => img !== imageUrl);
        await updateProduct(productId, { images: updatedImages });
      }
      toast.success('Immagine eliminata!');
      onUpdate();
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  return (
    <div className="space-y-6">
      {/* Immagine Principale */}
      <Card className="p-6">
        <Label className="text-lg font-semibold mb-4 block">Immagine Principale</Label>
        <p className="text-sm text-gray-600 mb-4">
          Questa immagine apparirà nella lista prodotti e come prima immagine nel carosello
        </p>
        
        {mainImage ? (
          <div className="relative inline-block">
            <img
              src={mainImage}
              alt="Main product"
              className="w-64 h-64 object-cover rounded-lg border"
            />
            <div className="absolute top-2 right-2">
              <button
                type="button"
                onClick={() => handleRemoveImage(mainImage, true)}
                className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-2 left-2">
              <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Principale
              </span>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageUpload}
              className="hidden"
              id="main-image-upload"
              disabled={uploading}
            />
            <label htmlFor="main-image-upload">
              <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Carica immagine principale</p>
              </div>
            </label>
          </div>
        )}
        
        {mainImage && (
          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageUpload}
              className="hidden"
              id="main-image-replace"
              disabled={uploading}
            />
            <label htmlFor="main-image-replace">
              <Button type="button" variant="outline" disabled={uploading} asChild>
                <span>Sostituisci Immagine</span>
              </Button>
            </label>
          </div>
        )}
      </Card>

      {/* Gallery Immagini */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Label className="text-lg font-semibold">Gallery Immagini</Label>
            <p className="text-sm text-gray-600 mt-1">
              Aggiungi altre immagini per mostrare diverse viste del prodotto
            </p>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
              id="gallery-upload"
              disabled={uploading}
            />
            <label htmlFor="gallery-upload">
              <Button type="button" disabled={uploading} asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Aggiungi Immagini
                </span>
              </Button>
            </label>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-500">Nessuna immagine nella gallery</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAsMain(imageUrl)}
                    className="bg-orange-600 text-white rounded-full p-2 hover:bg-orange-700"
                    title="Imposta come principale"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(imageUrl)}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    title="Elimina"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {uploading && (
        <div className="text-center text-sm text-gray-600">
          Upload in corso...
        </div>
      )}
    </div>
  );
}
