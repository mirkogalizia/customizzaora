'use client';

/**
 * CanvasEditor — Soluzione definitiva mobile + desktop
 * 
 * MOBILE:
 * - Tap sul canvas preview → modal fullscreen
 * - Nessuna maniglia Fabric.js su mobile (troppo piccole)
 * - Touch nativi sul wrapper per drag (1 dito) e pinch-zoom (2 dita)
 * - Barra contestuale che appare quando un oggetto è selezionato
 * - Slider per dimensione, rotazione, opacità
 * - "Fatto" usa router.back() sicuro, senza position:fixed che rompe iOS Safari
 * 
 * DESKTOP:
 * - Fabric.js standard con maniglie
 * - Toolbar esterna Toolbar.tsx
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';
import {
  ChevronLeft, Check, Upload, Type, Trash2,
  RotateCcw, Maximize2, AlignCenter, Copy,
} from 'lucide-react';

interface CanvasEditorProps {
  mockupUrl: string;
  mockupUrlBack?: string;
  side: 'front' | 'back';
  onSideChange?: (side: 'front' | 'back') => void;
  productName: string;
  printArea?: PrintAreaDimensions;
  printAreaBack?: PrintAreaDimensions;
}

const LOGICAL = 500;
const designStorage: Record<string, any> = {};

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function getPrintAreaCoords(img: HTMLImageElement | null, printArea?: PrintAreaDimensions) {
  let iX = 0, iY = 0, iW = LOGICAL, iH = LOGICAL;
  if (img?.naturalWidth && img?.naturalHeight) {
    const r = img.naturalWidth / img.naturalHeight;
    if (r >= 1) { iW = LOGICAL; iH = LOGICAL / r; iY = (LOGICAL - iH) / 2; }
    else        { iH = LOGICAL; iW = LOGICAL * r;  iX = (LOGICAL - iW) / 2; }
  }
  return {
    left:   iX + iW * (printArea?.xPercent     ?? 25) / 100,
    top:    iY + iH * (printArea?.yPercent      ?? 20) / 100,
    width:  iW * (printArea?.widthPercent       ?? 50) / 100,
    height: iH * (printArea?.heightPercent      ?? 45) / 100,
  };
}

// ─── SINGLE FABRIC CANVAS ────────────────────────────────────────────────────

function SingleFabricCanvas({
  mockupUrl, side, visible, printArea, displaySize, isMobile, onReady,
}: {
  mockupUrl: string; side: 'front' | 'back'; visible: boolean;
  printArea?: PrintAreaDimensions; displaySize: number; isMobile: boolean;
  onReady: (s: 'front' | 'back', c: fabric.Canvas, img: HTMLImageElement) => void;
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const fabricRef  = useRef<fabric.Canvas | null>(null);
  const imgRef     = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const storageKey = `design-${side}`;

  useEffect(() => {
    if (!canvasRef.current || !imgLoaded || fabricRef.current) return;
    const timer = setTimeout(() => {
      if (!canvasRef.current || !imgRef.current) return;
      const coords = getPrintAreaCoords(imgRef.current, printArea);
      
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: LOGICAL, height: LOGICAL,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        allowTouchScrolling: false,
        // Su mobile nascondiamo i controlli di Fabric — usiamo i nostri
        selection: !isMobile,
      });
      fabricRef.current = canvas;

      // Clip alla print area
      canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });

      // Rettangolo print area (visivo)
      const printRect = new fabric.Rect({
        ...coords,
        fill: 'rgba(16,185,129,0.04)',
        stroke: '#10b981', strokeWidth: 1.5, strokeDashArray: [6, 4],
        selectable: false, evented: false, name: 'printArea',
      });
      canvas.add(printRect);
      canvas.sendToBack(printRect);

      // Controlli Fabric — su mobile li nascondiamo, usiamo i nostri
      if (isMobile) {
        fabric.Object.prototype.set({
          hasControls: false,
          hasBorders: true,
          borderColor: '#f97316',
          borderScaleFactor: 2,
          padding: 12,
        });
      } else {
        fabric.Object.prototype.set({
          cornerSize: 16, cornerStyle: 'circle',
          borderColor: '#f97316', cornerColor: '#f97316',
          cornerStrokeColor: '#ffffff', transparentCorners: false,
          borderScaleFactor: 1.5, padding: 8,
        });
      }

      // Constraint: mantieni oggetto nell'area di stampa
      const constrain = (obj: fabric.Object) => {
        if ((obj as any).name === 'printArea') return;
        const b = obj.getBoundingRect();
        const vis = 0.25;
        let l = obj.left ?? 0, t = obj.top ?? 0;
        if (b.left < coords.left - b.width * vis)              l = coords.left - b.width * vis + (l - b.left);
        if (b.top  < coords.top  - b.height * vis)             t = coords.top  - b.height * vis + (t - b.top);
        if (b.left > coords.left + coords.width - b.width * vis)  l = coords.left + coords.width - b.width * vis + (l - b.left);
        if (b.top  > coords.top  + coords.height - b.height * vis) t = coords.top  + coords.height - b.height * vis + (t - b.top);
        obj.set({ left: l, top: t }); obj.setCoords();
      };
      canvas.on('object:moving',   e => constrain(e.target as fabric.Object));
      canvas.on('object:scaling',  e => constrain(e.target as fabric.Object));
      canvas.on('object:rotating', e => constrain(e.target as fabric.Object));

      // Autosave debounced
      let st: ReturnType<typeof setTimeout>;
      const save = () => {
        clearTimeout(st);
        st = setTimeout(() => {
          const objs = canvas.getObjects().filter(o => (o as any).name !== 'printArea');
          if (objs.length) designStorage[storageKey] = canvas.toJSON(['name']);
          else delete designStorage[storageKey];
        }, 300);
      };
      canvas.on('object:modified', save);
      canvas.on('object:added', save);
      canvas.on('object:removed', save);

      // Carica design salvato
      const saved = designStorage[storageKey];
      if (saved) {
        canvas.loadFromJSON(saved, () => {
          const pa = canvas.getObjects().find(o => (o as any).name === 'printArea');
          if (pa) canvas.sendToBack(pa);
          if (isMobile) canvas.getObjects().forEach(o => { if ((o as any).name !== 'printArea') o.set({ hasControls: false }); });
          canvas.requestRenderAll();
        });
      }

      // Reset globale
      const reset = () => {
        canvas.clear();
        canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
        const pr = new fabric.Rect({ ...coords, fill: 'rgba(16,185,129,0.04)', stroke: '#10b981', strokeWidth: 1.5, strokeDashArray: [6, 4], selectable: false, evented: false, name: 'printArea' });
        canvas.add(pr); canvas.sendToBack(pr);
        delete designStorage[storageKey];
        canvas.requestRenderAll();
      };
      window.addEventListener('resetCanvas', reset);
      window.addEventListener(`resetCanvas-${side}`, reset);

      // Zoom iniziale
      const zoom = displaySize / LOGICAL;
      canvas.setZoom(zoom); canvas.setWidth(displaySize); canvas.setHeight(displaySize);
      canvas.requestRenderAll();

      onReady(side, canvas, imgRef.current!);
    }, 80);
    return () => clearTimeout(timer);
  }, [imgLoaded]);

  useEffect(() => {
    if (!fabricRef.current) return;
    const zoom = displaySize / LOGICAL;
    fabricRef.current.setZoom(zoom);
    fabricRef.current.setWidth(displaySize);
    fabricRef.current.setHeight(displaySize);
    fabricRef.current.requestRenderAll();
  }, [displaySize]);

  return (
    <div style={{ display: visible ? 'block' : 'none', position: 'absolute', inset: 0 }}>
      <img
        ref={imgRef}
        src={mockupUrl}
        alt="mockup"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        draggable={false}
        onLoad={() => { setImgLoaded(false); setTimeout(() => setImgLoaded(true), 40); }}
      />
      <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ─── BARRA CONTESTUALE MOBILE (appare quando oggetto selezionato) ─────────────

function MobileContextBar({ canvas, onDeselect }: {
  canvas: fabric.Canvas | null;
  onDeselect: () => void;
}) {
  const [obj, setObj] = useState<fabric.Object | null>(null);
  const [scale, setScale] = useState(100);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!canvas) return;
    const onSel = () => {
      const o = canvas.getActiveObject();
      if (!o || (o as any).name === 'printArea') { setObj(null); return; }
      setObj(o);
      setScale(Math.round((o.scaleX ?? 1) * 100));
      setAngle(Math.round(o.angle ?? 0));
    };
    const onClear = () => setObj(null);
    canvas.on('selection:created', onSel);
    canvas.on('selection:updated', onSel);
    canvas.on('selection:cleared', onClear);
    return () => {
      canvas.off('selection:created', onSel);
      canvas.off('selection:updated', onSel);
      canvas.off('selection:cleared', onClear);
    };
  }, [canvas]);

  if (!obj) return null;

  const applyScale = (v: number) => {
    if (!obj || !canvas) return;
    const s = v / 100;
    obj.set({ scaleX: s, scaleY: s });
    obj.setCoords();
    canvas.requestRenderAll();
    setScale(v);
  };

  const applyAngle = (v: number) => {
    if (!obj || !canvas) return;
    obj.set({ angle: v });
    obj.setCoords();
    canvas.requestRenderAll();
    setAngle(v);
  };

  const center = () => {
    if (!obj || !canvas) return;
    const pa = canvas.getObjects().find(o => (o as any).name === 'printArea') as any;
    if (pa) { obj.set({ left: pa.left + pa.width / 2, top: pa.top + pa.height / 2 }); }
    else { canvas.centerObject(obj); }
    obj.setCoords();
    canvas.requestRenderAll();
  };

  const duplicate = () => {
    if (!obj || !canvas) return;
    obj.clone((cloned: fabric.Object) => {
      cloned.set({ left: (obj.left ?? 0) + 24, top: (obj.top ?? 0) + 24, hasControls: false });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  };

  const remove = () => {
    if (!obj || !canvas) return;
    canvas.remove(obj);
    canvas.requestRenderAll();
    setObj(null);
    onDeselect();
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3 space-y-3">
      {/* Dimensione */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 w-20 flex-shrink-0">Dimensione</span>
        <input
          type="range" min={10} max={200} value={scale}
          onChange={e => applyScale(Number(e.target.value))}
          className="flex-1 accent-orange-600 h-1.5"
        />
        <span className="text-xs font-bold text-gray-700 w-10 text-right">{scale}%</span>
      </div>

      {/* Rotazione */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 w-20 flex-shrink-0">Rotazione</span>
        <input
          type="range" min={0} max={360} value={angle}
          onChange={e => applyAngle(Number(e.target.value))}
          className="flex-1 accent-orange-600 h-1.5"
        />
        <span className="text-xs font-bold text-gray-700 w-10 text-right">{angle}°</span>
      </div>

      {/* Azioni rapide */}
      <div className="flex gap-2 pt-1">
        <button onClick={center}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 rounded-xl py-2.5 text-xs font-semibold text-gray-700 active:bg-gray-200">
          <AlignCenter className="w-4 h-4" />Centra
        </button>
        <button onClick={duplicate}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 rounded-xl py-2.5 text-xs font-semibold text-gray-700 active:bg-gray-200">
          <Copy className="w-4 h-4" />Duplica
        </button>
        <button onClick={remove}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 rounded-xl py-2.5 text-xs font-semibold text-red-600 active:bg-red-100">
          <Trash2 className="w-4 h-4" />Elimina
        </button>
      </div>
    </div>
  );
}

// ─── MODAL FULLSCREEN MOBILE ──────────────────────────────────────────────────

function MobileFullscreenEditor({
  mockupUrl, mockupUrlBack, side, onSideChange, onClose,
  printArea, printAreaBack,
}: {
  mockupUrl: string; mockupUrlBack?: string;
  side: 'front' | 'back'; onSideChange: (s: 'front' | 'back') => void;
  onClose: () => void;
  printArea?: PrintAreaDimensions; printAreaBack?: PrintAreaDimensions;
}) {
  const fileRef           = useRef<HTMLInputElement>(null);
  const wrapperRef        = useRef<HTMLDivElement>(null);
  const canvasRef         = useRef<fabric.Canvas | null>(null);
  const imgElRef          = useRef<HTMLImageElement | null>(null);
  const [addMode, setAddMode] = useState<'image' | 'text' | null>(null);
  const [textValue, setTextValue] = useState('Il tuo testo');
  const [fontSize, setFontSize]   = useState(48);
  const [textColor, setTextColor] = useState('#000000');
  const [hasSelection, setHasSelection] = useState(false);
  const canvasSize = typeof window !== 'undefined' ? window.innerWidth : 390;

  // Blocca scroll iOS in modo sicuro (senza position:fixed che rompe Safari)
  useEffect(() => {
    const scrollY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleReady = useCallback((_: 'front' | 'back', canvas: fabric.Canvas, img: HTMLImageElement) => {
    canvasRef.current = canvas;
    imgElRef.current  = img;
    (window as any).fabricCanvas = canvas;

    // Ascolta selezione per mostrare/nascondere context bar
    canvas.on('selection:created', () => setHasSelection(true));
    canvas.on('selection:updated', () => setHasSelection(true));
    canvas.on('selection:cleared', () => setHasSelection(false));

    // ── TOUCH NATIVI SUL WRAPPER (non su Fabric) ────────────────────────────
    // Fabric.js non gestisce bene il pinch — lo facciamo noi a mano
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let lastTouchDist = 0;
    let lastScale     = 1;
    let activeObj: fabric.Object | null = null;

    const getTouchDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    wrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // Inizia pinch
        e.preventDefault();
        lastTouchDist = getTouchDist(e.touches[0], e.touches[1]);
        activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj as any).name !== 'printArea') {
          lastScale = activeObj.scaleX ?? 1;
        }
      }
    }, { passive: false });

    wrapper.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && activeObj) {
        e.preventDefault();
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        const ratio = dist / lastTouchDist;
        const newScale = Math.max(0.05, Math.min(10, lastScale * ratio));
        activeObj.set({ scaleX: newScale, scaleY: newScale });
        activeObj.setCoords();
        canvas.requestRenderAll();
        setHasSelection(true);
      }
    }, { passive: false });

    wrapper.addEventListener('touchend', () => {
      activeObj = null;
      lastTouchDist = 0;
    });
  }, []);

  const getCanvas = () => canvasRef.current;

  const getPrintCenter = () => {
    const c = getCanvas(); if (!c) return { x: 250, y: 250, w: 200, h: 200 };
    const pa = c.getObjects().find((o: any) => o.name === 'printArea') as any;
    if (!pa) return { x: 250, y: 250, w: 200, h: 200 };
    return { x: pa.left + pa.width / 2, y: pa.top + pa.height / 2, w: pa.width, h: pa.height };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const canvas = getCanvas(); if (!canvas) return;
    const { x, y, w, h } = getPrintCenter();
    const reader = new FileReader();
    reader.onload = ev => {
      fabric.Image.fromURL(ev.target?.result as string, img => {
        const maxW = w * 0.8;
        const maxH = h * 0.8;
        const scale = Math.min(maxW / (img.width ?? 1), maxH / (img.height ?? 1));
        img.set({ left: x, top: y, scaleX: scale, scaleY: scale, originX: 'center', originY: 'center', hasControls: false });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        setHasSelection(true);
        setAddMode(null);
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddText = () => {
    const canvas = getCanvas(); if (!canvas) return;
    const { x, y } = getPrintCenter();
    const t = new fabric.IText(textValue || 'Testo', {
      left: x, top: y, fontSize, fill: textColor,
      originX: 'center', originY: 'center',
      editable: true, hasControls: false,
    });
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.requestRenderAll();
    setHasSelection(true);
    setAddMode(null);
  };

  const COLORS = ['#000000','#ffffff','#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];
  const currentPrint = side === 'front' ? printArea : (printAreaBack ?? printArea);

  return (
    <div
      className="fixed inset-0 bg-white flex flex-col"
      style={{ zIndex: 9999, height: '100dvh' }}
    >
      {/* ── TOPBAR ── */}
      <div
        className="flex items-center justify-between px-4 bg-white border-b border-gray-100 flex-shrink-0"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(52px + env(safe-area-inset-top, 0px))',
        }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-gray-500 py-2 pr-3 -ml-1 active:opacity-60"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Indietro</span>
        </button>

        <span className="font-bold text-gray-900 text-sm absolute left-1/2 -translate-x-1/2">
          Personalizza
        </span>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold active:bg-orange-700"
        >
          <Check className="w-4 h-4" />Fatto
        </button>
      </div>

      {/* ── SWITCH FRONTE/RETRO ── */}
      <div className="flex gap-1.5 px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0">
        {(['front', 'back'] as const).map(s => (
          <button key={s} onClick={() => onSideChange(s)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              side === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            {s === 'front' ? '👕 Fronte' : '🔄 Retro'}
          </button>
        ))}
        {currentPrint && (
          <span className="flex items-center px-3 bg-gray-100 rounded-xl text-xs text-gray-500 whitespace-nowrap font-medium">
            {currentPrint.widthCm}×{currentPrint.heightCm}cm
          </span>
        )}
      </div>

      {/* ── CANVAS ── */}
      <div
        ref={wrapperRef}
        className="flex-1 relative bg-gray-50 overflow-hidden"
        style={{ touchAction: 'pan-y' }}
      >
        <div
          style={{
            width: canvasSize,
            height: canvasSize,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
          }}
        >
          <SingleFabricCanvas
            mockupUrl={mockupUrl}
            side="front"
            visible={side === 'front'}
            printArea={printArea}
            displaySize={canvasSize}
            isMobile={true}
            onReady={handleReady}
          />
          <SingleFabricCanvas
            mockupUrl={mockupUrlBack ?? mockupUrl}
            side="back"
            visible={side === 'back'}
            printArea={printAreaBack ?? printArea}
            displaySize={canvasSize}
            isMobile={true}
            onReady={handleReady}
          />
        </div>

        {/* Hint pinch */}
        {!hasSelection && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            1 dito = sposta · 2 dita = ridimensiona
          </div>
        )}
      </div>

      {/* ── CONTEXT BAR (quando oggetto selezionato) ── */}
      {hasSelection && (
        <MobileContextBar
          canvas={canvasRef.current}
          onDeselect={() => setHasSelection(false)}
        />
      )}

      {/* ── TOOLBAR AGGIUNTA ── */}
      {addMode === null && !hasSelection && (
        <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-3 flex-shrink-0"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white rounded-2xl py-4 font-bold text-sm active:bg-orange-700"
          >
            <Upload className="w-5 h-5" />Carica immagine
          </button>
          <button
            onClick={() => setAddMode('text')}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-2xl py-4 font-bold text-sm active:bg-gray-800"
          >
            <Type className="w-5 h-5" />Aggiungi testo
          </button>
        </div>
      )}

      {/* ── PANNELLO TESTO ── */}
      {addMode === 'text' && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 space-y-3 flex-shrink-0"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          {/* Input testo */}
          <div className="flex gap-2">
            <input
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              placeholder="Scrivi il tuo testo..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 outline-none"
              autoFocus
            />
            <button onClick={() => setAddMode(null)}
              className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 font-medium active:bg-gray-200">
              ✕
            </button>
          </div>

          {/* Font size */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 w-12 flex-shrink-0">Taglia</span>
            <input
              type="range" min={12} max={120} value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              className="flex-1 accent-orange-600 h-1.5"
            />
            <span className="text-xs font-bold text-gray-700 w-8 text-right">{fontSize}</span>
          </div>

          {/* Colori */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => setTextColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 flex-shrink-0 transition-transform active:scale-90 ${
                    textColor === c ? 'border-gray-900 scale-125' : 'border-white shadow-sm'
                  }`}
                />
              ))}
            </div>
          </div>

          <button onClick={handleAddText}
            className="w-full bg-gray-900 text-white rounded-2xl py-3.5 font-bold text-sm active:bg-gray-800">
            + Aggiungi testo al design
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}

// ─── CANVAS EDITOR (main export) ─────────────────────────────────────────────

export function CanvasEditor({
  mockupUrl, mockupUrlBack, side, onSideChange,
  productName, printArea, printAreaBack,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMapRef = useRef<Record<string, fabric.Canvas>>({});
  const [fullscreen, setFullscreen] = useState(false);

  const [displaySize, setDisplaySize] = useState(() =>
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, LOGICAL) : LOGICAL
  );

  const isMobile = displaySize < 640;

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    setDisplaySize(Math.min(containerRef.current.offsetWidth, LOGICAL));
  }, []);

  useEffect(() => {
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateSize]);

  const handleReady = useCallback((s: 'front' | 'back', canvas: fabric.Canvas) => {
    canvasMapRef.current[s] = canvas;
    if (s === side) (window as any).fabricCanvas = canvas;
  }, [side]);

  useEffect(() => {
    const c = canvasMapRef.current[side];
    if (c) (window as any).fabricCanvas = c;
  }, [side]);

  return (
    <>
      <div ref={containerRef} className="w-full select-none">
        {/* Preview canvas — su mobile mostra overlay cliccabile */}
        <div
          className="relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-md"
          style={{ width: displaySize, height: displaySize }}
        >
          <SingleFabricCanvas
            mockupUrl={mockupUrl}
            side="front"
            visible={side === 'front'}
            printArea={printArea}
            displaySize={displaySize}
            isMobile={false}
            onReady={handleReady}
          />
          <SingleFabricCanvas
            mockupUrl={mockupUrlBack ?? mockupUrl}
            side="back"
            visible={side === 'back'}
            printArea={printAreaBack ?? printArea}
            displaySize={displaySize}
            isMobile={false}
            onReady={handleReady}
          />

          {/* Badge lato */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wide pointer-events-none">
            {side === 'front' ? '● FRONTE' : '● RETRO'}
          </div>

          {/* Dimensioni stampa */}
          {(printArea || printAreaBack) && (
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 pointer-events-none shadow-sm">
              {(side === 'front' ? printArea : (printAreaBack ?? printArea))?.widthCm} × {(side === 'front' ? printArea : (printAreaBack ?? printArea))?.heightCm} cm
            </div>
          )}

          {/* Overlay tap su mobile — z-10 sopra Fabric.js con touchAction:auto */}
          {isMobile && (
            <div
              className="absolute inset-0 z-10 flex items-end justify-center pb-4"
              style={{ touchAction: 'auto', WebkitTapHighlightColor: 'transparent' }}
              onPointerDown={e => { e.preventDefault(); setFullscreen(true); }}
            >
              <div className="bg-gray-900/80 backdrop-blur-sm text-white text-sm font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg pointer-events-none">
                ✏️ Tocca per personalizzare
              </div>
            </div>
          )}
        </div>

        {!isMobile && (
          <p className="text-xs text-gray-400 text-center mt-2.5">
            Trascina per spostare · Usa le maniglie per ridimensionare e ruotare
          </p>
        )}
        {isMobile && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Tocca l'immagine per aprire l'editor
          </p>
        )}
      </div>

      {/* Modal fullscreen — solo mobile */}
      {isMobile && fullscreen && (
        <MobileFullscreenEditor
          mockupUrl={mockupUrl}
          mockupUrlBack={mockupUrlBack}
          side={side}
          onSideChange={s => { onSideChange?.(s); }}
          onClose={() => setFullscreen(false)}
          printArea={printArea}
          printAreaBack={printAreaBack}
        />
      )}
    </>
  );
}