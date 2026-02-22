'use client';

/**
 * Configurator — Toolbar completa stile Zakeke semplificato
 * 
 * DESKTOP: pannello laterale sinistro sempre visibile
 * MOBILE:  bottom sheet che sale su, canvas occupa tutto lo schermo
 * 
 * Un solo file, zero dipendenze esterne oltre a lucide-react.
 * Comunica con Fabric.js solo via window.fabricCanvas.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import {
  Upload, Type, Trash2, Copy, AlignCenter,
  RotateCcw, RotateCw, ZoomIn, ZoomOut,
  ChevronUp, ChevronDown, X, Minus, Plus,
  Bold, Italic,
} from 'lucide-react';

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useCanvas() {
  const get = (): fabric.Canvas | null => (window as any).fabricCanvas ?? null;

  const getActiveObj = () => {
    const cv = get(); if (!cv) return null;
    const o = cv.getActiveObject();
    return o && (o as any).name !== '__printArea' ? o : null;
  };

  const getPrintCenter = () => {
    const cv = get(); if (!cv) return { x: 250, y: 250, w: 200, h: 200 };
    const pa = cv.getObjects().find((o: any) => o.name === '__printArea') as any;
    return pa ? { x: pa.left + pa.width / 2, y: pa.top + pa.height / 2, w: pa.width, h: pa.height }
              : { x: 250, y: 250, w: 200, h: 200 };
  };

  return { get, getActiveObj, getPrintCenter };
}

// ─── CONTEXT BAR: appare quando un oggetto è selezionato ─────────────────────

function ContextBar({ onDelete }: { onDelete: () => void }) {
  const { get, getActiveObj } = useCanvas();
  const [scaleVal, setScaleVal] = useState(100);
  const [angleVal, setAngleVal] = useState(0);

  // Sincronizza valori con l'oggetto attivo
  useEffect(() => {
    const cv = get(); if (!cv) return;
    const sync = () => {
      const o = getActiveObj();
      if (!o) return;
      setScaleVal(Math.round((o.scaleX ?? 1) * 100));
      setAngleVal(Math.round(o.angle ?? 0));
    };
    cv.on('selection:created', sync);
    cv.on('selection:updated', sync);
    cv.on('object:modified', sync);
    return () => { cv.off('selection:created', sync); cv.off('selection:updated', sync); cv.off('object:modified', sync); };
  }, []);

  const applyScale = (v: number) => {
    const o = getActiveObj(); const cv = get();
    if (!o || !cv) return;
    const s = v / 100;
    o.set({ scaleX: s, scaleY: s }); o.setCoords(); cv.requestRenderAll();
    setScaleVal(v);
  };

  const applyAngle = (v: number) => {
    const o = getActiveObj(); const cv = get();
    if (!o || !cv) return;
    o.set({ angle: v }); o.setCoords(); cv.requestRenderAll();
    setAngleVal(v);
  };

  const center = () => {
    const o = getActiveObj(); const cv = get(); if (!o || !cv) return;
    const pa = cv.getObjects().find((x: any) => x.name === '__printArea') as any;
    if (pa) { o.set({ left: pa.left + pa.width / 2, top: pa.top + pa.height / 2 }); }
    else cv.centerObject(o);
    o.setCoords(); cv.requestRenderAll();
  };

  const duplicate = () => {
    const o = getActiveObj(); const cv = get(); if (!o || !cv) return;
    o.clone((cl: fabric.Object) => {
      cl.set({ left: (o.left ?? 0) + 20, top: (o.top ?? 0) + 20, hasControls: (o as any).hasControls });
      cv.add(cl); cv.setActiveObject(cl); cv.requestRenderAll();
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Elemento selezionato</p>

      {/* Dimensione */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700">Dimensione</span>
          <span className="text-sm font-bold text-gray-900">{scaleVal}%</span>
        </div>
        <input type="range" min={5} max={200} value={scaleVal}
          onChange={e => applyScale(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-orange-500 cursor-pointer" />
        <div className="flex justify-between mt-1">
          <button onClick={() => applyScale(Math.max(5, scaleVal - 10))}
            className="text-xs text-gray-400 hover:text-gray-700"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={() => applyScale(Math.min(200, scaleVal + 10))}
            className="text-xs text-gray-400 hover:text-gray-700"><ZoomIn className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Rotazione */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700">Rotazione</span>
          <span className="text-sm font-bold text-gray-900">{angleVal}°</span>
        </div>
        <input type="range" min={0} max={360} value={angleVal}
          onChange={e => applyAngle(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-orange-500 cursor-pointer" />
        <div className="flex justify-between mt-1">
          <button onClick={() => applyAngle((angleVal - 15 + 360) % 360)}
            className="text-xs text-gray-400 hover:text-gray-700"><RotateCcw className="w-3.5 h-3.5" /></button>
          <button onClick={() => applyAngle((angleVal + 15) % 360)}
            className="text-xs text-gray-400 hover:text-gray-700"><RotateCw className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Azioni */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={center}
          className="flex flex-col items-center gap-1 py-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-xs font-medium text-gray-600">
          <AlignCenter className="w-4 h-4" />Centra
        </button>
        <button onClick={duplicate}
          className="flex flex-col items-center gap-1 py-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-xs font-medium text-gray-600">
          <Copy className="w-4 h-4" />Duplica
        </button>
        <button onClick={onDelete}
          className="flex flex-col items-center gap-1 py-3 rounded-xl border border-red-200 hover:border-red-400 hover:bg-red-50 transition-all text-xs font-medium text-red-500">
          <Trash2 className="w-4 h-4" />Elimina
        </button>
      </div>
    </div>
  );
}

// ─── PANEL IMMAGINE ───────────────────────────────────────────────────────────

function ImagePanel() {
  const { get, getPrintCenter } = useCanvas();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const cv = get(); if (!cv) return;
    const { x, y, w, h } = getPrintCenter();
    const reader = new FileReader();
    reader.onload = ev => {
      fabric.Image.fromURL(ev.target?.result as string, img => {
        const scale = Math.min((w * 0.8) / (img.width ?? 1), (h * 0.8) / (img.height ?? 1));
        img.set({ left: x, top: y, scaleX: scale, scaleY: scale, originX: 'center', originY: 'center' });
        cv.add(img); cv.setActiveObject(img); cv.requestRenderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Immagine</p>
      <button onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 rounded-xl p-6 flex flex-col items-center gap-2 transition-all group">
        <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-full flex items-center justify-center transition-colors">
          <Upload className="w-5 h-5 text-orange-600" />
        </div>
        <span className="text-sm font-semibold text-gray-700">Carica immagine</span>
        <span className="text-xs text-gray-400">PNG, JPG, SVG — max 10MB</span>
        <span className="text-xs text-orange-500 font-medium">PNG con sfondo trasparente consigliato</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── PANEL TESTO ─────────────────────────────────────────────────────────────

const FONTS = ['Arial', 'Georgia', 'Impact', 'Courier New', 'Trebuchet MS', 'Verdana', 'Times New Roman'];
const COLORS_PRESET = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

function TextPanel() {
  const { get, getPrintCenter } = useCanvas();
  const [text, setText]         = useState('Il tuo testo');
  const [font, setFont]         = useState('Arial');
  const [size, setSize]         = useState(48);
  const [color, setColor]       = useState('#000000');
  const [bold, setBold]         = useState(false);
  const [italic, setItalic]     = useState(false);

  const add = () => {
    const cv = get(); if (!cv) return;
    const { x, y } = getPrintCenter();
    cv.add(new fabric.IText(text || 'Testo', {
      left: x, top: y, fontFamily: font, fontSize: size, fill: color,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      originX: 'center', originY: 'center', editable: true,
    }));
    cv.requestRenderAll();
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Testo</p>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Testo</label>
        <input value={text} onChange={e => setText(e.target.value)}
          className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
          placeholder="Scrivi qui..." />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Font</label>
        <select value={font} onChange={e => setFont(e.target.value)}
          className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl px-3 py-2.5 text-sm outline-none bg-white transition-colors">
          {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-500">Dimensione</label>
          <span className="text-xs font-bold text-gray-700">{size}px</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSize(s => Math.max(8, s - 4))}
            className="w-8 h-8 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <input type="range" min={8} max={120} value={size} onChange={e => setSize(Number(e.target.value))}
            className="flex-1 h-2 rounded-full accent-orange-500 cursor-pointer" />
          <button onClick={() => setSize(s => Math.min(120, s + 4))}
            className="w-8 h-8 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setBold(b => !b)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${bold ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
          <Bold className="w-4 h-4" />Bold
        </button>
        <button onClick={() => setItalic(i => !i)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${italic ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
          <Italic className="w-4 h-4" />Italic
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Colore</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS_PRESET.map(c => (
            <button key={c} onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${color === c ? 'border-gray-900 scale-110' : 'border-white shadow-sm hover:scale-105'}`} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 overflow-hidden" title="Colore personalizzato" />
        </div>
      </div>

      <button onClick={add}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 font-bold text-sm transition-colors">
        + Aggiungi testo
      </button>
    </div>
  );
}

// ─── PANNELLO PRINCIPALE ──────────────────────────────────────────────────────

type Tab = 'image' | 'text' | 'edit';

function PanelContent({ selectedObj, onDelete }: {
  selectedObj: fabric.Object | null;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<Tab>(selectedObj ? 'edit' : 'image');

  useEffect(() => { if (selectedObj) setTab('edit'); }, [selectedObj]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'image', label: 'Immagine', icon: Upload },
    { id: 'text',  label: 'Testo',    icon: Type },
    { id: 'edit',  label: 'Modifica', icon: selectedObj ? AlignCenter : X },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Contenuto tab */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'image' && <ImagePanel />}
        {tab === 'text'  && <TextPanel />}
        {tab === 'edit'  && (
          selectedObj
            ? <ContextBar onDelete={onDelete} />
            : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-gray-400">Nessun elemento selezionato</p>
                <p className="text-xs text-gray-300 mt-1">Tocca un elemento sul canvas per modificarlo</p>
              </div>
            )
        )}
      </div>
    </div>
  );
}

// ─── CONFIGURATOR EXPORT ─────────────────────────────────────────────────────

interface ConfiguratorProps {
  side:         'front' | 'back';
  onSideChange: (s: 'front' | 'back') => void;
  onReset:      () => void;
  printArea?:   any;
  printAreaBack?: any;
}

export function Configurator({ side, onSideChange, onReset, printArea, printAreaBack }: ConfiguratorProps) {
  const [isMobile, setIsMobile]     = useState(false);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [selectedObj, setSelectedObj] = useState<fabric.Object | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Ascolta selezione dal CanvasEditor via window.fabricCanvas
  useEffect(() => {
    const interval = setInterval(() => {
      const cv = (window as any).fabricCanvas as fabric.Canvas | null;
      if (!cv) return;
      clearInterval(interval);
      cv.on('selection:created', e => {
        const o = (e as any).selected?.[0];
        if (o && (o as any).name !== '__printArea') { setSelectedObj(o); if (isMobile) setSheetOpen(true); }
      });
      cv.on('selection:updated', e => {
        const o = (e as any).selected?.[0];
        if (o && (o as any).name !== '__printArea') setSelectedObj(o);
      });
      cv.on('selection:cleared', () => setSelectedObj(null));
    }, 200);
    return () => clearInterval(interval);
  }, [isMobile]);

  const deleteSelected = () => {
    const cv = (window as any).fabricCanvas as fabric.Canvas | null;
    if (!cv) return;
    const o = cv.getActiveObject();
    if (o && (o as any).name !== '__printArea') { cv.remove(o); cv.requestRenderAll(); setSelectedObj(null); }
  };

  const currentPrint = side === 'front' ? printArea : (printAreaBack ?? printArea);

  // ── DESKTOP: pannello laterale ────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Header pannello */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Personalizza</p>
          {currentPrint && (
            <p className="text-xs text-gray-400 mt-0.5">Area stampa: {currentPrint.widthCm}×{currentPrint.heightCm}cm</p>
          )}
        </div>

        {/* Switch fronte/retro */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
            {(['front', 'back'] as const).map(s => (
              <button key={s} onClick={() => onSideChange(s)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${side === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {s === 'front' ? '👕 Fronte' : '🔄 Retro'}
              </button>
            ))}
          </div>
        </div>

        {/* Contenuto */}
        <div className="flex-1 overflow-y-auto p-4">
          <PanelContent selectedObj={selectedObj} onDelete={deleteSelected} />
        </div>

        {/* Reset */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />Cancella design
          </button>
        </div>
      </div>
    );
  }

  // ── MOBILE: bottom sheet + barra fissa in basso ────────────────────────────
  return (
    <>
      {/* Switch fronte/retro sopra il canvas — sempre visibile */}
      <div className="flex gap-2 mb-3">
        {(['front', 'back'] as const).map(s => (
          <button key={s} onClick={() => onSideChange(s)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${side === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {s === 'front' ? '👕 Fronte' : '🔄 Retro'}
          </button>
        ))}
        <button onClick={onReset}
          className="px-3.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Backdrop */}
      {sheetOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)} />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '78vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Titolo + chiudi */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
          <span className="font-bold text-gray-900">Personalizza</span>
          <button onClick={() => setSheetOpen(false)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(78vh - 80px)' }}>
          <PanelContent selectedObj={selectedObj} onDelete={deleteSelected} />
        </div>
      </div>

      {/* Barra fissa bottom — sempre visibile su mobile */}
      {!sheetOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex gap-3"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={() => { setSheetOpen(true); }}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white rounded-2xl py-3.5 font-bold text-sm active:bg-orange-700 transition-colors"
          >
            <Upload className="w-4 h-4" />Immagine
          </button>
          <button
            onClick={() => { setSheetOpen(true); }}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-2xl py-3.5 font-bold text-sm active:bg-gray-800 transition-colors"
          >
            <Type className="w-4 h-4" />Testo
          </button>
          {selectedObj && (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-2xl px-4 py-3.5 font-bold text-sm active:bg-blue-700 transition-colors"
            >
              <AlignCenter className="w-4 h-4" />Modifica
            </button>
          )}
        </div>
      )}

      {/* Spacer per non coprire il canvas con la barra */}
      <div style={{ height: 'calc(72px + env(safe-area-inset-bottom, 0px))' }} />
    </>
  );
}
