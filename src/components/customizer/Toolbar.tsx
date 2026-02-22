'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fabric } from 'fabric';
import { toast } from 'sonner';
import { Upload, Type, Trash2, Copy, RotateCw, Palette, ChevronDown, ChevronUp } from 'lucide-react';

interface ToolbarProps {
  side: 'front' | 'back';
  isMobile?: boolean;
}

const FONTS = ['Arial', 'Georgia', 'Impact', 'Courier New', 'Verdana', 'Trebuchet MS', 'Montserrat'];

export function Toolbar({ side, isMobile = false }: ToolbarProps) {
  const [text, setText]           = useState('Il tuo testo');
  const [fontSize, setFontSize]   = useState(48);
  const [textColor, setTextColor] = useState('#000000');
  const [font, setFont]           = useState('Arial');
  const [showText, setShowText]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getCanvas = (): fabric.Canvas | null => (window as any).fabricCanvas ?? null;

  const getPrintAreaCenter = () => {
    const canvas = getCanvas();
    if (!canvas) return { x: 250, y: 250 };
    const pa = canvas.getObjects().find((o: any) => o.name === 'printArea');
    if (!pa) return { x: 250, y: 250 };
    return { x: (pa as any).left + (pa as any).width / 2, y: (pa as any).top + (pa as any).height / 2 };
  };

  // ── Azioni ───────────────────────────────────────────────────────────────

  const handleAddText = () => {
    const canvas = getCanvas();
    if (!canvas) { toast.error('Canvas non pronto'); return; }
    const { x, y } = getPrintAreaCenter();
    canvas.add(new fabric.IText(text, {
      left: x, top: y,
      fontSize, fill: textColor, fontFamily: font,
      originX: 'center', originY: 'center', editable: true,
    }));
    canvas.requestRenderAll();
    toast.success('Testo aggiunto — clicca per modificarlo');
    setShowText(false);
  };

  const handleImageUpload = (file: File) => {
    const canvas = getCanvas();
    if (!canvas) { toast.error('Canvas non pronto'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      fabric.Image.fromURL(e.target?.result as string, img => {
        const { x, y } = getPrintAreaCenter();
        const pa = canvas.getObjects().find((o: any) => o.name === 'printArea') as any;
        const maxSize = pa ? Math.min(pa.width, pa.height) * 0.7 : 200;
        const scale = Math.min(maxSize / (img.width ?? 1), maxSize / (img.height ?? 1));
        img.set({ left: x, top: y, scaleX: scale, scaleY: scale, originX: 'center', originY: 'center' });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        toast.success('Immagine aggiunta');
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') {
      canvas.remove(obj); canvas.requestRenderAll();
      toast.success('Eliminato');
    } else toast.error('Seleziona un elemento');
  };

  const handleDuplicate = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') {
      obj.clone((c: fabric.Object) => {
        c.set({ left: (c.left ?? 0) + 20, top: (c.top ?? 0) + 20 });
        canvas.add(c); canvas.setActiveObject(c); canvas.requestRenderAll();
        toast.success('Duplicato');
      });
    } else toast.error('Seleziona un elemento');
  };

  const handleRotate = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) { obj.rotate((obj.angle ?? 0) + 15); canvas.requestRenderAll(); }
  };

  const handleClear = () => {
    if (!confirm('Cancellare tutto il design?')) return;
    window.dispatchEvent(new CustomEvent('resetCanvas'));
    toast.success('Design cancellato');
  };

  // ── MOBILE ───────────────────────────────────────────────────────────────
  // Su mobile la Toolbar è integrata nel MobileEditor — qui mostriamo
  // solo i controlli aggiuntivi desktop se non siamo su mobile

  if (isMobile) return null; // il MobileEditor gestisce tutto inline

  // ── DESKTOP ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* Azioni rapide */}
      <div className="flex gap-2 flex-wrap">
        {/* Upload immagine */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <Upload className="w-4 h-4" />Carica immagine
        </button>

        {/* Toggle pannello testo */}
        <button
          onClick={() => setShowText(!showText)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <Type className="w-4 h-4" />Testo
          {showText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Duplica */}
        <button onClick={handleDuplicate}
          className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 rounded-lg px-3 py-2.5 text-sm transition-colors">
          <Copy className="w-4 h-4" />
        </button>

        {/* Ruota */}
        <button onClick={handleRotate}
          className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 rounded-lg px-3 py-2.5 text-sm transition-colors">
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Elimina */}
        <button onClick={handleDelete}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-3 py-2.5 text-sm transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Pulisci tutto */}
        <button onClick={handleClear}
          className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-500 transition-colors ml-auto">
          Pulisci tutto
        </button>
      </div>

      {/* Pannello testo — espandibile */}
      {showText && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">✏️ Testo</p>

          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Scrivi qui..."
            className="h-10"
            onKeyDown={e => e.key === 'Enter' && handleAddText()}
          />

          <div className="grid grid-cols-3 gap-2">
            {/* Font */}
            <select
              value={font}
              onChange={e => setFont(e.target.value)}
              className="col-span-2 border rounded-lg px-3 py-2 text-sm"
            >
              {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>

            {/* Dimensione */}
            <Input
              type="number" value={fontSize}
              onChange={e => setFontSize(parseInt(e.target.value) || 48)}
              min="12" max="200" className="h-10 text-sm"
            />
          </div>

          {/* Colore */}
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-400" />
            <input type="color" value={textColor}
              onChange={e => setTextColor(e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer" />
            <span className="text-xs text-gray-500 font-mono">{textColor}</span>
            {/* Preset colori */}
            {['#000000','#FFFFFF','#EF4444','#F97316','#3B82F6','#10B981'].map(c => (
              <button key={c} onClick={() => setTextColor(c)}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: c }} />
            ))}
          </div>

          <Button onClick={handleAddText} className="w-full h-10 font-semibold bg-orange-600 hover:bg-orange-700">
            <Type className="w-4 h-4 mr-2" />Aggiungi al design
          </Button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
    </div>
  );
}
