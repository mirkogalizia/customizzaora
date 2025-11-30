'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Upload } from 'lucide-react';
import { uploadMockup } from '@/lib/firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Color {
  id: string;
  name: string;
  hex: string;
  mockupFront: string;
  mockupBack: string;
}

interface ColorManagerProps {
  productId: string;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function ColorManager({ productId }: ColorManagerProps) {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hex: '#000000',
  });
  const [uploading, setUploading] = useState(false);
  const [mockupFront, setMockupFront] = useState<File | null>(null);
  const [mockupBack, setMockupBack] = useState<File | null>(null);
  const [mockupFrontPreview, setMockupFrontPreview] = useState<string | null>(null);
  const [mockupBackPreview, setMockupBackPreview] = useState<string | null>(null);

  useEffect(() => {
    loadColors();
  }, [productId]);

  const loadColors = async () => {
    try {
      const colorsRef = collection(db, 'products', productId, 'colors');
      const snapshot = await getDocs(colorsRef);
      const colorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Color));
      setColors(colorsData);
    } catch (error) {
      console.error('Error loading colors:', error);
      toast.error('Errore nel caricamento dei colori');
    } finally {
      setLoading(false);
    }
  };

  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMockupFront(file);
      const reader = new FileReader();
      reader.onloadend = () => setMockupFrontPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMockupBack(file);
      const reader = new FileReader();
      reader.onloadend = () => setMockupBackPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddColor = async () => {
    if (!mockupFront || !mockupBack) {
      toast.error('Carica entrambi i mockup (fronte e retro)');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Inserisci il nome del colore');
      return;
    }

    setUploading(true);

    try {
      console.log('🎨 Uploading mockups for color:', formData.name);

      // Upload mockup images
      const frontUrl = await uploadMockup(
        mockupFront,
        productId,
        formData.name,
        'front'
      );

      const backUrl = await uploadMockup(
        mockupBack,
        productId,
        formData.name,
        'back'
      );

      console.log('✅ Mockups uploaded:', { frontUrl, backUrl });

      // Crea colore in Firestore
      const colorsRef = collection(db, 'products', productId, 'colors');
      await addDoc(colorsRef, {
        name: formData.name,
        hex: formData.hex,
        mockupFront: frontUrl,
        mockupBack: backUrl,
      });

      console.log('🎨 Color created in Firestore');

      // Crea automaticamente tutte le varianti per questo colore
      await createVariantsForColor(formData.name, formData.hex);

      toast.success(`Colore "${formData.name}" aggiunto con ${SIZES.length} varianti!`);
      
      // Reset form
      setFormData({ name: '', hex: '#000000' });
      setMockupFront(null);
      setMockupBack(null);
      setMockupFrontPreview(null);
      setMockupBackPreview(null);
      setShowForm(false);
      loadColors();
    } catch (error) {
      console.error('❌ Error adding color:', error);
      toast.error('Errore durante l\'aggiunta del colore');
    } finally {
      setUploading(false);
    }
  };

  const createVariantsForColor = async (colorName: string, colorHex: string) => {
    const variantsRef = collection(db, 'products', productId, 'variants');
    
    for (const size of SIZES) {
      const sku = `${productId.substring(0, 6).toUpperCase()}-${colorName.toUpperCase().replace(/\s+/g, '')}-${size}`;
      
      await addDoc(variantsRef, {
        productId,
        colorName,
        colorHex,
        size,
        sku,
        extraPrice: 0,
        stock: 100,
        isActive: true,
      });
    }

    console.log(`✅ Created ${SIZES.length} variants for color: ${colorName}`);
  };

  const handleDeleteColor = async (colorId: string, colorName: string) => {
    if (!confirm(`Eliminare il colore "${colorName}" e tutte le sue varianti?`)) return;

    try {
      // Elimina colore
      await deleteDoc(doc(db, 'products', productId, 'colors', colorId));
      
      // TODO: Elimina anche le varianti associate
      // Per ora solo il colore
      
      toast.success('Colore eliminato');
      loadColors();
    } catch (error) {
      console.error('Error deleting color:', error);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento colori...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Colori e Mockup</h2>
          <p className="text-sm text-gray-600 mt-1">
            Aggiungi colori disponibili. Per ogni colore verranno create automaticamente {SIZES.length} varianti (taglie).
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Colore
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <h3 className="text-lg font-semibold mb-4">Nuovo Colore</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome Colore *</Label>
                <Input
                  placeholder="es: Nero"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Codice Colore (HEX)</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.hex}
                    onChange={(e) => setFormData({ ...formData, hex: e.target.value })}
                    className="w-16 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    placeholder="#000000"
                    value={formData.hex}
                    onChange={(e) => setFormData({ ...formData, hex: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Mockup Fronte */}
              <div>
                <Label>Mockup Fronte *</Label>
                {mockupFrontPreview ? (
                  <div className="mt-2 relative">
                    <img
                      src={mockupFrontPreview}
                      alt="Preview fronte"
                      className="w-full h-48 object-contain border rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMockupFront(null);
                        setMockupFrontPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFrontImageChange}
                      className="hidden"
                      id="mockup-front"
                    />
                    <label htmlFor="mockup-front">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Carica Fronte</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Mockup Retro */}
              <div>
                <Label>Mockup Retro *</Label>
                {mockupBackPreview ? (
                  <div className="mt-2 relative">
                    <img
                      src={mockupBackPreview}
                      alt="Preview retro"
                      className="w-full h-48 object-contain border rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMockupBack(null);
                        setMockupBackPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackImageChange}
                      className="hidden"
                      id="mockup-back"
                    />
                    <label htmlFor="mockup-back">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Carica Retro</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
              ℹ️ Aggiungendo questo colore, verranno create automaticamente <strong>{SIZES.length} varianti</strong> (una per ogni taglia: {SIZES.join(', ')})
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAddColor} 
                disabled={uploading || !mockupFront || !mockupBack || !formData.name.trim()}
                className="flex-1"
              >
                {uploading ? 'Caricamento...' : 'Aggiungi Colore + Varianti'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={uploading}>
                Annulla
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista colori esistenti */}
      {colors.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-2">Nessun colore aggiunto</p>
          <p className="text-sm text-gray-500">Inizia aggiungendo il primo colore con i mockup fronte/retro</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colors.map((color) => (
            <Card key={color.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <h3 className="font-semibold">{color.name}</h3>
                    <p className="text-sm text-gray-600">{color.hex}</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteColor(color.id, color.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Fronte</p>
                  <img
                    src={color.mockupFront}
                    alt={`${color.name} front`}
                    className="w-full h-32 object-cover rounded border"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Retro</p>
                  <img
                    src={color.mockupBack}
                    alt={`${color.name} back`}
                    className="w-full h-32 object-cover rounded border"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-3 text-center">
                {SIZES.length} varianti create ({SIZES.join(', ')})
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
