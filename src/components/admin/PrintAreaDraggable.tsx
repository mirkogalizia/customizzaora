'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { updateProduct } from '@/lib/firebase/products';
import { PrintAreaDimensions } from '@/types';
import { toast } from 'sonner';
import { Ruler, Save, Move } from 'lucide-react';

interface PrintAreaDraggableProps {
  productId: string;
  frontMockup?: string;
  backMockup?: string;
  currentPrintAreas?: {
    front: PrintAreaDimensions;
    back: PrintAreaDimensions;
  };
  onUpdate: () => void;
}

export function PrintAreaDraggable({ 
  productId, 
  frontMockup, 
  backMockup, 
  currentPrintAreas,
  onUpdate 
}: PrintAreaDraggableProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Default: area centrata 30%×40% dell'immagine
  const defaultArea: PrintAreaDimensions = {
    xPercent: 35,      // 35% da sinistra
    yPercent: 30,      // 30% dall'alto
    widthPercent: 30,  // 30% larghezza
    heightPercent: 40, // 40% altezza
    widthCm: 28,
    heightCm: 35,
  };
  
  const [frontArea, setFrontArea] = useState<PrintAreaDimensions>(
    currentPrintAreas?.front || defaultArea
  );
  
  const [backArea, setBackArea] = useState<PrintAreaDimensions>(
    currentPrintAreas?.back || defaultArea
  );

  const currentArea = activeTab === 'front' ? frontArea : backArea;
  const setCurrentArea = activeTab === 'front' ? setFrontArea : setBackArea;
  const currentMockup = activeTab === 'front' ? frontMockup : backMockup;

  // Calcola il bounding box dell'immagine (dopo object-contain)
  const getImageBounds = () => {
    if (!imgRef.current || !containerRef.current) return null;
    
    const container = containerRef.current.getBoundingClientRect();
    const img = imgRef.current;
    const imgNaturalRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = container.width / container.height;
    
    let imgWidth, imgHeight, imgX, imgY;
    
    if (imgNaturalRatio > containerRatio) {
      // Immagine limitata dalla larghezza
      imgWidth = container.width;
      imgHeight = container.width / imgNaturalRatio;
      imgX = 0;
      imgY = (container.height - imgHeight) / 2;
    } else {
      // Immagine limitata dall'altezza
      imgHeight = container.height;
      imgWidth = container.height * imgNaturalRatio;
      imgX = (container.width - imgWidth) / 2;
      imgY = 0;
    }
    
    return { x: imgX, y: imgY, width: imgWidth, height: imgHeight };
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.stopPropagation();
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const imgBounds = getImageBounds();
    if (!imgBounds) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left - imgBounds.x;
    const mouseY = e.clientY - containerRect.top - imgBounds.y;
    
    // Converti in percentuale dell'immagine
    const mouseXPercent = (mouseX / imgBounds.width) * 100;
    const mouseYPercent = (mouseY / imgBounds.height) * 100;

    if (isDragging) {
      // Trascina area
      const newXPercent = Math.max(0, Math.min(100 - currentArea.widthPercent, mouseXPercent - currentArea.widthPercent / 2));
      const newYPercent = Math.max(0, Math.min(100 - currentArea.heightPercent, mouseYPercent - currentArea.heightPercent / 2));
      
      setCurrentArea({ 
        ...currentArea, 
        xPercent: newXPercent, 
        yPercent: newYPercent 
      });
    } else if (isResizing && resizeHandle) {
      // Ridimensiona area
      let newArea = { ...currentArea };
      
      if (resizeHandle.includes('right')) {
        newArea.widthPercent = Math.max(10, Math.min(100 - newArea.xPercent, mouseXPercent - newArea.xPercent));
      }
      if (resizeHandle.includes('left')) {
        const newWidth = Math.max(10, newArea.xPercent + newArea.widthPercent - mouseXPercent);
        newArea.xPercent = newArea.xPercent + newArea.widthPercent - newWidth;
        newArea.widthPercent = newWidth;
      }
      if (resizeHandle.includes('bottom')) {
        newArea.heightPercent = Math.max(10, Math.min(100 - newArea.yPercent, mouseYPercent - newArea.yPercent));
      }
      if (resizeHandle.includes('top')) {
        const newHeight = Math.max(10, newArea.yPercent + newArea.heightPercent - mouseYPercent);
        newArea.yPercent = newArea.yPercent + newArea.heightPercent - newHeight;
        newArea.heightPercent = newHeight;
      }
      
      setCurrentArea(newArea);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleReset = () => {
    setCurrentArea(defaultArea);
    toast.success('Area resettata al centro');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProduct(productId, {
        printAreas: {
          front: frontArea,
          back: backArea,
        },
      });
      
      console.log('✅ Admin - Saved areas (% relative to image):', {
        front: frontArea,
        back: backArea,
      });
      
      toast.success('✅ Aree di stampa salvate!');
      onUpdate();
    } catch (error) {
      console.error('Error saving print areas:', error);
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const presetTShirt = () => {
    setFrontArea({ xPercent: 35, yPercent: 30, widthPercent: 30, heightPercent: 40, widthCm: 28, heightCm: 35 });
    setBackArea({ xPercent: 35, yPercent: 30, widthPercent: 30, heightPercent: 40, widthCm: 28, heightCm: 35 });
    toast.success('Preset T-Shirt applicato');
  };

  const presetHoodie = () => {
    setFrontArea({ xPercent: 30, yPercent: 25, widthPercent: 40, heightPercent: 50, widthCm: 30, heightCm: 38 });
    setBackArea({ xPercent: 30, yPercent: 25, widthPercent: 40, heightPercent: 50, widthCm: 30, heightCm: 38 });
    toast.success('Preset Felpa applicato');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-start gap-3">
          <Move className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-bold text-lg text-blue-900">Area di Stampa - Relativa all'Immagine</h3>
            <p className="text-sm text-blue-700 mt-1">
              1. Trascina l'area verde per posizionarla sull'immagine<br/>
              2. Trascina gli angoli per ridimensionarla<br/>
              3. Le coordinate sono relative all'immagine del mockup<br/>
              4. Stessa posizione IDENTICA nel frontend! 🎯
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={presetTShirt}>
          📏 T-Shirt (28×35 cm)
        </Button>
        <Button variant="outline" size="sm" onClick={presetHoodie}>
          📏 Felpa (30×38 cm)
        </Button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('front')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'front'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Fronte
        </button>
        <button
          onClick={() => setActiveTab('back')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'back'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Retro
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Trascina e Ridimensiona</h4>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>

          {currentMockup ? (
            <div
              ref={containerRef}
              className="relative bg-gray-50 rounded-lg overflow-hidden select-none border-2 border-gray-200"
              style={{
                width: '100%',
                paddingBottom: '100%',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="absolute inset-0">
                {/* MOCKUP */}
                <img
                  ref={imgRef}
                  src={currentMockup}
                  alt={`Mockup ${activeTab}`}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ opacity: 0.9 }}
                  draggable={false}
                />

                {/* AREA TRASCINABILE - posizionata relative all'immagine */}
                <div
                  className="absolute border-4 border-green-500 bg-green-500/20 cursor-move"
                  style={{
                    left: `${currentArea.xPercent}%`,
                    top: `${currentArea.yPercent}%`,
                    width: `${currentArea.widthPercent}%`,
                    height: `${currentArea.heightPercent}%`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e)}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                      {currentArea.widthCm} × {currentArea.heightCm} cm
                    </div>
                  </div>

                  {/* Handle ridimensionamento */}
                  {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((handle) => (
                    <div
                      key={handle}
                      className="absolute w-4 h-4 bg-white border-2 border-green-600 rounded-full cursor-pointer hover:scale-125 transition-transform z-10"
                      style={{
                        top: handle.includes('top') ? '-8px' : 'auto',
                        bottom: handle.includes('bottom') ? '-8px' : 'auto',
                        left: handle.includes('left') ? '-8px' : 'auto',
                        right: handle.includes('right') ? '-8px' : 'auto',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, handle)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Aggiungi prima i mockup</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold mb-4">Impostazioni</h4>
          
          <div className="space-y-4">
            <Card className="p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 mb-2">📍 Posizione (% dell'immagine):</p>
              <div className="space-y-1 text-xs text-gray-600">
       		<p>• X: {(currentArea.xPercent || 0).toFixed(1)}%</p>
<p>• Y: {(currentArea.yPercent || 0).toFixed(1)}%</p>
<p>• Larghezza: {(currentArea.widthPercent || 0).toFixed(1)}%</p>
<p>• Altezza: {(currentArea.heightPercent || 0).toFixed(1)}%</p>

              </div>
            </Card>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
              <strong>💡 Dimensioni REALI:</strong> per il file di stampa @ 300 DPI
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Larghezza (cm)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="5"
                  max="50"
                  value={currentArea.widthCm}
                  onChange={(e) => setCurrentArea({
                    ...currentArea,
                    widthCm: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Altezza (cm)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="5"
                  max="60"
                  value={currentArea.heightCm}
                  onChange={(e) => setCurrentArea({
                    ...currentArea,
                    heightCm: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              </div>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-2">🖨️ File @ 300 DPI:</p>
              <div className="space-y-1 text-xs text-blue-600">
                <p>• {Math.round(currentArea.widthCm * 118.11)} × {Math.round(currentArea.heightCm * 118.11)} px</p>
                <p>• {currentArea.widthCm} × {currentArea.heightCm} cm @ 300 DPI</p>
              </div>
            </Card>
          </div>
        </Card>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={saving}
        size="lg"
        className="w-full h-12 font-bold"
      >
        <Save className="w-5 h-5 mr-2" />
        {saving ? 'Salvataggio...' : 'Salva Area di Stampa'}
      </Button>
    </div>
  );
}
