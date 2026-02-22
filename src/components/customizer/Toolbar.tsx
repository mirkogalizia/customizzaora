'use client';

/**
 * Toolbar — DEFINITIVA
 * Desktop: pannello laterale sempre visibile con tab Immagine / Testo / Azioni
 * Mobile: barra fissa in basso + bottom sheet
 */

import { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { toast } from 'sonner';
import {
  Upload, Type, Trash2, Copy, RotateCw, ZoomIn, ZoomOut,
  ImageIcon, PenLine, X, ChevronUp, Palette,
} from 'lucide-react';

interface ToolbarProps {
  side: 'front' | 'back';
}

const FONTS = [
  'Arial', 'Georgia', 'Impact', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Times New Roman',
];

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
];

// Hook per accedere al canvas corrente
function useCanvas() {
  const get = (): fabric.Canvas | null => (window as any).fabricCanvas ?? null;

  const getPrintCenter = () => {
    const c = get();
    if (!c) return { x: 250, y: 250, w: 200, h: 180 };
    const pa = c.getObjects().find((o: any) => o.name === 'printArea') as any;
    if (!pa) return { x: 250, y: 250, w: 200, h: 180 };
    return { x: pa.left + pa.width / 2, y: pa.top + pa.height / 2, w: pa.width, h: pa.height };
  };

  const addImage = (file: File) => {
    const c = get();
    if (!c) { toast.error('Canvas non pronto'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File troppo grande (max 10MB)'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      fabric.Image.fromURL(e.target?.result as string, img => {
        const { x, y, w, h } = getPrintCenter();
        const maxW = w * 0.75, maxH = h * 0.75;
        const scale = Math.min(maxW / (img.width ?? 1), maxH / (img.height ?? 1));
        img.set({ left: x, top: y, scaleX: scale, scaleY: scale, originX: 'center', originY: 'center' });
        c.add(img); c.setActiveObject(img); c.requestRenderAll();
        toast.success('Immagine aggiunta!');
      });
    };
    reader.readAsDataURL(file);
  };

  const addText = (text: string, opts: { fontSize: number; color: string; font: string; bold: boolean; italic: boolean }) => {
    const c = get();
    if (!c) { toast.error('Canvas non pronto'); return; }
    const { x, y } = getPrintCenter();
    const obj = new fabric.IText(text || 'Testo', {
      left: x, top: y,
      fontSize: opts.fontSize,
      fill: opts.color,
      fontFamily: opts.font,
      fontWeight: opts.bold ? 'bold' : 'normal',
      fontStyle: opts.italic ? 'italic' : 'normal',
      originX: 'center', originY: 'center',
      editable: true,
    });
    c.add(obj); c.setActiveObject(obj); c.requestRenderAll();
    toast.success('Testo aggiunto — clicca per modificarlo');
  };

  const deleteSelected = () => {
    const c = get(); if (!c) return;
    const obj = c.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') {
      c.remove(obj); c.requestRenderAll();
    } else toast.error('Seleziona prima un elemento');
  };

  const duplicate = () => {
    const c = get(); if (!c) return;
    const obj = c.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') {
      obj.clone((cl: fabric.Object) => {
        cl.set({ left: (cl.left ?? 0) + 24, top: (cl.top ?? 0) + 24 });
        c.add(cl); c.setActiveObject(cl); c.requestRenderAll();
        toast.success('Duplicato');
      });
    } else toast.error('Seleziona prima un elemento');
  };

  const scaleObj = (factor: number) => {
    const c = get(); if (!c) return;
    const obj = c.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') {
      const s = (obj.scaleX ?? 1) * factor;
      obj.scale(Math.max(0.05, Math.min(10, s)));
      c.requestRenderAll();
    } else toast.error('Seleziona prima un elemento');
  };

  const rotateObj = (deg: number) => {
    const c = get(); if (!c) return;
    const obj = c.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') {
      obj.rotate(((obj.angle ?? 0) + deg + 360) % 360);
      c.requestRenderAll();
    } else toast.error('Seleziona prima un elemento');
  };

  const clearAll = () => {
    window.dispatchEvent(new CustomEvent('resetCanvas'));
    toast.success('Design cancellato');
  };

  return { addImage, addText, deleteSelected, duplicate, scaleObj, rotateObj, clearAll };
}

// ─── PANNELLO CONTENUTO (condiviso desktop/mobile) ────────────────────────────

function ToolbarContent({
  onClose, compact = false,
}: {
  onClose?: () => void;
  compact?: boolean;
}) {
  const [tab, setTab]           = useState<'image' | 'text' | 'actions'>('image');
  const [text, setText]         = useState('Il tuo testo');
  const [fontSize, setFontSize] = useState(52);
  const [color, setColor]       = useState('#000000');
  const [font, setFont]         = useState('Arial');
  const [bold, setBold]         = useState(false);
  const [italic, setItalic]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const actions = useCanvas();

  const tabClass = (t: string) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
      tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className={compact ? '' : 'h-full flex flex-col'}>
      {/* Header mobile con chiudi */}
      {onClose && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <span className="font-semibold text-gray-800">Personalizza</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mx-4 mt-2 mb-4">
        <button className={tabClass('image')} onClick={() => setTab('image')}>
          <ImageIcon className="w-4 h-4" />Immagine
        </button>
        <button className={tabClass('text')} onClick={() => setTab('text')}>
          <PenLine className="w-4 h-4" />Testo
        </button>
        <button className={tabClass('actions')} onClick={() => setTab('actions')}>
          <RotateCw className="w-4 h-4" />Modifica
        </button>
      </div>

      <div className={`px-4 space-y-4 ${compact ? '' : 'flex-1 overflow-y-auto pb-6'}`}>

        {/* ── TAB IMMAGINE ── */}
        {tab === 'image' && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full group flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 rounded-2xl py-8 transition-all"
            >
              <div className="w-12 h-12 bg-orange-100 group-hover:bg-orange-200 rounded-2xl flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Carica immagine</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG · max 10MB</p>
              </div>
            </button>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800">
                💡 <strong>Consiglio:</strong> Usa PNG con sfondo trasparente per un risultato professionale
              </p>
            </div>
          </>
        )}

        {/* ── TAB TESTO ── */}
        {tab === 'text' && (
          <>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Testo</label>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Scrivi qui..."
                className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Font</label>
                <select
                  value={font}
                  onChange={e => setFont(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Dimensione</label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setFontSize(s => Math.max(10, s - 4))}
                    className="px-3 py-2.5 text-gray-500 hover:bg-gray-50 font-bold text-lg leading-none">−</button>
                  <span className="flex-1 text-center text-sm font-semibold">{fontSize}</span>
                  <button onClick={() => setFontSize(s => Math.min(200, s + 4))}
                    className="px-3 py-2.5 text-gray-500 hover:bg-gray-50 font-bold text-lg leading-none">+</button>
                </div>
              </div>
            </div>

            {/* Stile */}
            <div className="flex gap-2">
              <button onClick={() => setBold(b => !b)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${bold ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                B
              </button>
              <button onClick={() => setItalic(i => !i)}
                className={`px-4 py-2 rounded-xl border-2 text-sm italic font-semibold transition-all ${italic ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                I
              </button>
            </div>

            {/* Colori */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Colore</label>
              <div className="flex flex-wrap gap-2 items-center">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${color === c ? 'border-gray-900 scale-110 shadow-md' : 'border-white shadow-sm'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color" value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
                    title="Colore personalizzato"
                  />
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center pointer-events-none"
                    style={{ backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color }}>
                    {PRESET_COLORS.includes(color) && <Palette className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => { actions.addText(text, { fontSize, color, font, bold, italic }); onClose?.(); }}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Type className="w-4 h-4" />Aggiungi al design
            </button>
          </>
        )}

        {/* ── TAB AZIONI ── */}
        {tab === 'actions' && (
          <>
            <p className="text-xs text-gray-400">Seleziona un elemento sul canvas poi usa i controlli</p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: ZoomIn,   label: 'Ingrandisci',  sub: '+20%',  action: () => actions.scaleObj(1.2) },
                { icon: ZoomOut,  label: 'Riduci',       sub: '-20%',  action: () => actions.scaleObj(0.83) },
                { icon: RotateCw, label: 'Ruota destra', sub: '+15°',  action: () => actions.rotateObj(15) },
                { icon: RotateCw, label: 'Ruota sinistra', sub: '-15°', action: () => actions.rotateObj(-15), flip: true },
                { icon: Copy,     label: 'Duplica',      sub: 'copia', action: actions.duplicate },
                { icon: Trash2,   label: 'Elimina',      sub: 'rimuovi', action: actions.deleteSelected, danger: true },
              ].map(({ icon: Icon, label, sub, action, danger, flip }) => (
                <button key={label} onClick={action}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:shadow-sm active:scale-95 text-left ${
                    danger ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-4 h-4 ${flip ? 'scale-x-[-1]' : ''}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={actions.clearAll}
              className="w-full mt-2 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-xl py-2.5 text-sm font-medium transition-all">
              🗑 Cancella tutto il design
            </button>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) { actions.addImage(f); onClose?.(); } }} />
    </div>
  );
}

// ─── TOOLBAR DESKTOP ─────────────────────────────────────────────────────────

export function DesktopToolbar({ side }: ToolbarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <ToolbarContent />
    </div>
  );
}

// ─── TOOLBAR MOBILE ──────────────────────────────────────────────────────────

export function MobileToolbar({ side }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const actions = useCanvas();

  // Blocca scroll body quando aperto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Barra fissa bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 pt-3 pb-safe">
        <div className="flex gap-2 max-w-xl mx-auto pb-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-600 active:bg-orange-700 text-white rounded-2xl py-4 font-bold text-sm transition-colors shadow-lg"
          >
            <Upload className="w-5 h-5" />Carica immagine
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 active:bg-gray-800 text-white rounded-2xl py-4 font-bold text-sm transition-colors shadow-lg"
          >
            <Type className="w-5 h-5" />Testo &amp; altro
          </button>
        </div>
      </div>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Drag handle */}
            <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex-1 overflow-y-auto pb-8">
              <ToolbarContent onClose={() => setOpen(false)} compact />
            </div>
          </div>
        </div>
      )}

      {/* Spacer per non coprire contenuto */}
      <div className="h-24" />

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) actions.addImage(f); }} />
    </>
  );
}

// ─── EXPORT DEFAULT (backwards compat) ───────────────────────────────────────

export function Toolbar({ side }: ToolbarProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile ? <MobileToolbar side={side} /> : <DesktopToolbar side={side} />;
}
