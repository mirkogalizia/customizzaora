'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type, Image as ImageIcon, Trash2, Copy, RotateCw, Upload, Palette } from 'lucide-react';
import { fabric } from 'fabric';
import { toast } from 'sonner';

interface EditorToolbarProps {
  side: 'front' | 'back';
}

const FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Montserrat',
  'Roboto',
];

export function EditorToolbar({ side }: EditorToolbarProps) {
  const [textInput, setTextInput] = useState('Il tuo testo');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(48);

  const getCanvas = (): fabric.Canvas | null => {
    return (window as any).fabricCanvas || null;
  };

  const addText = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const text = new fabric.IText(textInput, {
      left: 100,
      top: 100,
      fontFamily: selectedFont,
      fill: textColor,
      fontSize: fontSize,
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    toast.success('✨ Testo aggiunto! Clicca per modificarlo');
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const canvas = getCanvas();
    if (!canvas) return;

    // Validazione
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Immagine troppo grande! Max 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      
      fabric.Image.fromURL(imgUrl, (img) => {
        // Scala l'immagine per adattarla
        const maxWidth = 300;
        const maxHeight = 300;
        const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
        
        img.scale(scale);
        img.set({
          left: 50,
          top: 50,
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        toast.success('🖼️ Immagine aggiunta!');
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.requestRenderAll();
      toast.success('🗑️ Elemento eliminato');
    } else {
      toast.error('Seleziona un elemento da eliminare');
    }
  };

  const duplicateSelected = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.requestRenderAll();
        toast.success('📋 Elemento duplicato');
      });
    } else {
      toast.error('Seleziona un elemento da duplicare');
    }
  };

  const rotateSelected = () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const currentAngle = activeObject.angle || 0;
      activeObject.rotate(currentAngle + 45);
      canvas.requestRenderAll();
    } else {
      toast.error('Seleziona un elemento da ruotare');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <label className="flex-1 min-w-[140px]">
          <input
            type="file"
            accept="image/*"
            onChange={addImage}
            className="hidden"
          />
          <Button asChild className="w-full h-12 font-semibold">
            <span>
              <ImageIcon className="w-5 h-5 mr-2" />
              Carica Immagine
            </span>
          </Button>
        </label>

        <Button 
          onClick={deleteSelected} 
          variant="destructive" 
          className="h-12 px-6"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Elimina
        </Button>

        <Button 
          onClick={duplicateSelected} 
          variant="outline" 
          className="h-12 px-6"
        >
          <Copy className="w-5 h-5 mr-2" />
          Duplica
        </Button>

        <Button 
          onClick={rotateSelected} 
          variant="outline" 
          className="h-12 px-6"
        >
          <RotateCw className="w-5 h-5 mr-2" />
          Ruota
        </Button>
      </div>

      {/* Text Editor */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200">
        <h4 className="font-bold text-lg mb-4 flex items-center">
          <Type className="w-5 h-5 mr-2 text-orange-600" />
          Aggiungi Testo
        </h4>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Testo</Label>
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Inserisci il tuo testo..."
              className="mt-1 h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold">Font</Label>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full mt-1 p-3 border-2 rounded-lg text-sm font-medium"
              >
                {FONTS.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-semibold">Dimensione</Label>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                min="12"
                max="200"
                className="mt-1 h-12"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold flex items-center">
              <Palette className="w-4 h-4 mr-1" />
              Colore Testo
            </Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-20 h-12 rounded-lg border-2 cursor-pointer"
              />
              <Input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 h-12 font-mono"
              />
            </div>
          </div>

          <Button onClick={addText} className="w-full h-12 font-bold text-base">
            <Type className="w-5 h-5 mr-2" />
            Aggiungi Testo al Design
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900 font-medium">
          💡 <strong>Suggerimento:</strong> Trascina per spostare, pizzica per zoom/ruotare. Rimani nell'area verde!
        </p>
      </div>
    </div>
  );
}
