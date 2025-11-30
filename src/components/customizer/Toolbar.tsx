'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fabric } from 'fabric';
import { toast } from 'sonner';
import { Upload, Type, Trash2 } from 'lucide-react';

interface ToolbarProps {
  side: 'front' | 'back';
}

export function Toolbar({ side }: ToolbarProps) {
  const [text, setText] = useState('Il tuo testo');
  const [fontSize, setFontSize] = useState(40);

  // Ottieni il centro dell'area di stampa
  const getPrintAreaCenter = () => {
    const canvas = (window as any).fabricCanvas;
    if (!canvas) return { x: 250, y: 250 };

    const printAreaRect = canvas.getObjects().find((obj: any) => obj.name === 'printArea');
    if (!printAreaRect) return { x: 250, y: 250 };

    return {
      x: printAreaRect.left + printAreaRect.width / 2,
      y: printAreaRect.top + printAreaRect.height / 2,
    };
  };

  const handleAddText = () => {
    const canvas = (window as any).fabricCanvas;
    if (!canvas) {
      toast.error('Canvas non pronto');
      return;
    }

    const center = getPrintAreaCenter();

    const textObj = new fabric.Text(text, {
      left: center.x,
      top: center.y,
      fontSize: fontSize,
      fill: '#000000',
      fontFamily: 'Arial',
      originX: 'center',
      originY: 'center',
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.requestRenderAll();
    toast.success('Testo aggiunto');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const canvas = (window as any).fabricCanvas;
    if (!canvas) {
      toast.error('Canvas non pronto');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      
      fabric.Image.fromURL(imgUrl, (img) => {
        const center = getPrintAreaCenter();
        
        // Scala l'immagine per stare nell'area (max 200px)
        const maxSize = 200;
        const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1));
        
        img.set({
          left: center.x,
          top: center.y,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        toast.success('Immagine aggiunta');
      });
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteSelected = () => {
    const canvas = (window as any).fabricCanvas;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject as any).name !== 'printArea') {
      canvas.remove(activeObject);
      canvas.requestRenderAll();
      toast.success('Elemento eliminato');
    } else {
      toast.error('Seleziona un elemento da eliminare');
    }
  };

  const handleClearAll = () => {
    const canvas = (window as any).fabricCanvas;
    if (!canvas) return;

    if (confirm('Vuoi eliminare tutti gli elementi?')) {
      const objects = canvas.getObjects().filter((obj: any) => obj.name !== 'printArea');
      objects.forEach((obj: any) => canvas.remove(obj));
      canvas.requestRenderAll();
      toast.success('Canvas pulito');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Type className="w-5 h-5 text-gray-600" />
        <span className="font-medium">Aggiungi Testo</span>
      </div>
      
      <div className="space-y-2">
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Il tuo testo"
          className="w-full"
        />
        
        <div className="flex gap-2">
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value) || 40)}
            min="10"
            max="200"
            className="w-24"
          />
          <Button onClick={handleAddText} className="flex-1">
            Aggiungi Testo
          </Button>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="w-5 h-5 text-gray-600" />
          <span className="font-medium">Carica Immagine</span>
        </div>
        
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button variant="outline" className="w-full cursor-pointer" asChild>
            <span>Scegli Immagine</span>
          </Button>
        </label>
      </div>

      <div className="border-t pt-4 flex gap-2">
        <Button 
          onClick={handleDeleteSelected} 
          variant="destructive" 
          className="flex-1"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Elimina Selezionato
        </Button>
        <Button 
          onClick={handleClearAll} 
          variant="outline" 
          className="flex-1"
        >
          Pulisci Tutto
        </Button>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        💡 <strong>Suggerimento:</strong> Clicca su un elemento per selezionarlo, trascina per spostarlo, usa gli angoli per ridimensionarlo
      </div>
    </div>
  );
}

