'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';
import { Check, ZoomIn, ZoomOut, RotateCw, Trash2, Upload, Type, X, ChevronLeft } from 'lucide-react';

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

// ─── CANVAS SINGOLO (invariato, funziona bene) ────────────────────────────────

function SingleFabricCanvas({ mockupUrl, side, visible, printArea, displaySize, onReady }: {
  mockupUrl: string; side: 'front' | 'back'; visible: boolean;
  printArea?: PrintAreaDimensions; displaySize: number;
  onReady: (s: 'front' | 'back', c: fabric.Canvas) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const imgRef    = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const storageKey = `design-${side}`;

  const getCoords = useCallback(() => {
    const img = imgRef.current;
    let iX = 0, iY = 0, iW = LOGICAL, iH = LOGICAL;
    if (img?.naturalWidth && img?.naturalHeight) {
      const r = img.naturalWidth / img.naturalHeight;
      if (r >= 1) { iW = LOGICAL; iH = LOGICAL / r; iY = (LOGICAL - iH) / 2; }
      else        { iH = LOGICAL; iW = LOGICAL * r;  iX = (LOGICAL - iW) / 2; }
    }
    return {
      left:   iX + iW * (printArea?.xPercent    ?? 25) / 100,
      top:    iY + iH * (printArea?.yPercent     ?? 20) / 100,
      width:  iW * (printArea?.widthPercent      ?? 50) / 100,
      height: iH * (printArea?.heightPercent     ?? 45) / 100,
    };
  }, [printArea]);

  useEffect(() => {
    if (!canvasRef.current || !imgLoaded || fabricRef.current) return;
    const timer = setTimeout(() => {
      if (!canvasRef.current) return;
      const coords = getCoords();
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: LOGICAL, height: LOGICAL,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        allowTouchScrolling: false,
      });
      fabricRef.current = canvas;
      canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
      const printRect = new fabric.Rect({
        ...coords, fill: 'rgba(16,185,129,0.04)',
        stroke: '#10b981', strokeWidth: 1.5, strokeDashArray: [6, 4],
        selectable: false, evented: false, name: 'printArea',
      });
      canvas.add(printRect);
      canvas.sendToBack(printRect);
      fabric.Object.prototype.set({
        cornerSize: 16, cornerStyle: 'circle',
        borderColor: '#f97316', cornerColor: '#f97316',
        cornerStrokeColor: '#ffffff', transparentCorners: false,
        borderScaleFactor: 1.5, padding: 8, hasRotatingPoint: true,
      });
      const constrain = (obj: fabric.Object) => {
        if ((obj as any).name === 'printArea') return;
        const b = obj.getBoundingRect();
        const vis = 0.25;
        const { left: px, top: py, width: pw, height: ph } = coords;
        let l = obj.left ?? 0, t = obj.top ?? 0;
        if (b.left < px - b.width * vis)       l = px - b.width * vis + (l - b.left);
        if (b.top  < py - b.height * vis)       t = py - b.height * vis + (t - b.top);
        if (b.left > px + pw - b.width * vis)   l = px + pw - b.width * vis + (l - b.left);
        if (b.top  > py + ph - b.height * vis)  t = py + ph - b.height * vis + (t - b.top);
        obj.set({ left: l, top: t }); obj.setCoords();
      };
      canvas.on('object:moving',   e => constrain(e.target as fabric.Object));
      canvas.on('object:scaling',  e => constrain(e.target as fabric.Object));
      canvas.on('object:rotating', e => constrain(e.target as fabric.Object));
      let st: NodeJS.Timeout;
      const save = () => { clearTimeout(st); st = setTimeout(() => {
        const objs = canvas.getObjects().filter(o => (o as any).name !== 'printArea');
        if (objs.length) designStorage[storageKey] = canvas.toJSON(['name']);
        else delete designStorage[storageKey];
      }, 300); };
      canvas.on('object:modified', save);
      canvas.on('object:added', save);
      canvas.on('object:removed', save);
      const saved = designStorage[storageKey];
      if (saved) canvas.loadFromJSON(saved, () => {
        const pa = canvas.getObjects().find(o => (o as any).name === 'printArea');
        if (pa) canvas.sendToBack(pa);
        canvas.requestRenderAll();
      });
      const reset = () => {
        canvas.clear();
        canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
        canvas.add(new fabric.Rect({ ...coords, fill: 'rgba(16,185,129,0.04)', stroke: '#10b981', strokeWidth: 1.5, strokeDashArray: [6, 4], selectable: false, evented: false, name: 'printArea' }));
        canvas.sendToBack(canvas.getObjects()[0]);
        delete designStorage[storageKey];
        canvas.requestRenderAll();
      };
      window.addEventListener('resetCanvas', reset);
      window.addEventListener(`resetCanvas-${side}`, reset);
      const zoom = displaySize / LOGICAL;
      canvas.setZoom(zoom); canvas.setWidth(displaySize); canvas.setHeight(displaySize);
      canvas.requestRenderAll();
      onReady(side, canvas);
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
      <img ref={imgRef} src={mockupUrl} alt="mockup"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
        draggable={false}
        onLoad={() => { setImgLoaded(false); setTimeout(() => setImgLoaded(true), 40); }} />
      <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ─── MINI TOOLBAR MOBILE (dentro la modal fullscreen) ─────────────────────────

function MobileEditorToolbar({ side, onClose, onSideChange, printArea, printAreaBack, fileInputRef }: {
  side: 'front' | 'back';
  onClose: () => void;
  onSideChange: (s: 'front' | 'back') => void;
  printArea?: PrintAreaDimensions;
  printAreaBack?: PrintAreaDimensions;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [tab, setTab] = useState<'add' | 'edit'>('add');
  const [text, setText] = useState('Il tuo testo');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#000000');

  const COLORS = ['#000000','#ffffff','#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6'];

  const getCanvas = () => (window as any).fabricCanvas as fabric.Canvas | null;

  const getPrintCenter = () => {
    const c = getCanvas(); if (!c) return { x: 250, y: 250, w: 200, h: 180 };
    const pa = c.getObjects().find((o: any) => o.name === 'printArea') as any;
    if (!pa) return { x: 250, y: 250, w: 200, h: 180 };
    return { x: pa.left + pa.width / 2, y: pa.top + pa.height / 2, w: pa.width, h: pa.height };
  };

  const addText = () => {
    const c = getCanvas(); if (!c) return;
    const { x, y } = getPrintCenter();
    const obj = new fabric.IText(text || 'Testo', {
      left: x, top: y, fontSize, fill: color,
      originX: 'center', originY: 'center', editable: true,
    });
    c.add(obj); c.setActiveObject(obj); c.requestRenderAll();
    setTab('edit');
  };

  const scaleObj = (f: number) => {
    const c = getCanvas(); if (!c) return;
    const obj = c.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') { obj.scale(Math.max(0.1, (obj.scaleX ?? 1) * f)); c.requestRenderAll(); }
  };

  const rotateObj = () => {
    const c = getCanvas(); if (!c) return;
    const obj = c.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') { obj.rotate(((obj.angle ?? 0) + 15) % 360); c.requestRenderAll(); }
  };

  const deleteObj = () => {
    const c = getCanvas(); if (!c) return;
    const obj = c.getActiveObject();
    if (obj && (obj as any).name !== 'printArea') { c.remove(obj); c.requestRenderAll(); }
  };

  const activePrint = side === 'front' ? printArea : (printAreaBack ?? printArea);

  return (
    <div className="flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Switch fronte/retro */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="flex flex-1 gap-1 bg-gray-100 p-1 rounded-2xl">
          {(['front','back'] as const).map(s => (
            <button key={s} onClick={() => onSideChange(s)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${side === s ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              {s === 'front' ? '👕 Fronte' : '🔄 Retro'}
            </button>
          ))}
        </div>
        {activePrint && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-2 rounded-xl whitespace-nowrap">
            {activePrint.widthCm}×{activePrint.heightCm}cm
          </span>
        )}
      </div>

      {/* Tab add / edit */}
      <div className="flex gap-1 px-4 mb-3">
        <button onClick={() => setTab('add')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === 'add' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
          + Aggiungi
        </button>
        <button onClick={() => setTab('edit')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === 'edit' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
          ✏️ Modifica
        </button>
      </div>

      {/* Contenuto tab */}
      <div className="px-4 pb-3">
        {tab === 'add' && (
          <div className="space-y-3">
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white rounded-2xl py-4 font-bold active:scale-98 transition-transform">
              <Upload className="w-5 h-5" />Carica immagine
            </button>
            <div className="flex gap-2">
              <input value={text} onChange={e => setText(e.target.value)}
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 outline-none"
                placeholder="Scrivi testo..." />
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-2">
                <button onClick={() => setFontSize(s => Math.max(12, s-4))} className="text-gray-400 font-bold px-1">−</button>
                <span className="text-xs font-bold text-gray-700 w-7 text-center">{fontSize}</span>
                <button onClick={() => setFontSize(s => Math.min(120, s+4))} className="text-gray-400 font-bold px-1">+</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-gray-900 scale-125' : 'border-white shadow-sm'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <button onClick={addText}
                className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-bold active:scale-95">
                <Type className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {tab === 'edit' && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: ZoomIn,   label: '+20%',   action: () => scaleObj(1.2) },
              { icon: ZoomOut,  label: '-20%',   action: () => scaleObj(0.83) },
              { icon: RotateCw, label: '+15°',   action: rotateObj },
              { icon: Trash2,   label: 'Elimina', action: deleteObj, danger: true },
            ].map(({ icon: Icon, label, action, danger }) => (
              <button key={label} onClick={action}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-semibold active:scale-95 transition-transform ${danger ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 text-gray-700'}`}>
                <Icon className="w-5 h-5" />{label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MODAL FULLSCREEN MOBILE ──────────────────────────────────────────────────

function MobileFullscreenEditor({ mockupUrl, mockupUrlBack, side, onSideChange, onClose, printArea, printAreaBack, canvasMapRef, onReady }: {
  mockupUrl: string; mockupUrlBack?: string;
  side: 'front' | 'back'; onSideChange: (s: 'front' | 'back') => void;
  onClose: () => void;
  printArea?: PrintAreaDimensions; printAreaBack?: PrintAreaDimensions;
  canvasMapRef: React.MutableRefObject<Record<string, fabric.Canvas>>;
  onReady: (s: 'front' | 'back', c: fabric.Canvas) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasSize = window.innerWidth;

  // Blocca scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const canvas = (window as any).fabricCanvas as fabric.Canvas | null;
    if (!canvas) return;
    const pa = canvas.getObjects().find((o: any) => o.name === 'printArea') as any;
    const cx = pa ? pa.left + pa.width / 2 : canvasSize / 2;
    const cy = pa ? pa.top + pa.height / 2 : canvasSize / 2;
    const maxW = pa ? pa.width * 0.75 : canvasSize * 0.5;
    const maxH = pa ? pa.height * 0.75 : canvasSize * 0.5;
    const reader = new FileReader();
    reader.onload = ev => {
      fabric.Image.fromURL(ev.target?.result as string, img => {
        const scale = Math.min(maxW / (img.width ?? 1), maxH / (img.height ?? 1));
        img.set({ left: cx, top: cy, scaleX: scale, scaleY: scale, originX: 'center', originY: 'center' });
        canvas.add(img); canvas.setActiveObject(img); canvas.requestRenderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const currentMockup = side === 'front' ? mockupUrl : (mockupUrlBack ?? mockupUrl);
  const currentPrintArea = side === 'front' ? printArea : (printAreaBack ?? printArea);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col" style={{ height: '100dvh' }}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 bg-white border-b border-gray-100 flex-shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(52px + env(safe-area-inset-top))' }}>
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-500 active:text-gray-900">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Prodotto</span>
        </button>
        <span className="font-bold text-gray-900 text-sm">Personalizza</span>
        <button onClick={onClose}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform">
          <Check className="w-4 h-4" />Fatto
        </button>
      </div>

      {/* Canvas area — occupa tutto lo spazio disponibile */}
      <div className="flex-1 relative bg-gray-50 overflow-hidden">
        <div style={{ width: canvasSize, height: canvasSize, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <SingleFabricCanvas
            mockupUrl={side === 'front' ? mockupUrl : (mockupUrlBack ?? mockupUrl)}
            side="front"
            visible={side === 'front'}
            printArea={printArea}
            displaySize={canvasSize}
            onReady={onReady}
          />
          <SingleFabricCanvas
            mockupUrl={side === 'back' ? (mockupUrlBack ?? mockupUrl) : mockupUrl}
            side="back"
            visible={side === 'back'}
            printArea={printAreaBack ?? printArea}
            displaySize={canvasSize}
            onReady={onReady}
          />
        </div>

        {/* Hint tocco */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
          Trascina · Pizzica per ridimensionare · Ruota
        </div>
      </div>

      {/* Toolbar bottom */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        <MobileEditorToolbar
          side={side}
          onClose={onClose}
          onSideChange={onSideChange}
          printArea={printArea}
          printAreaBack={printAreaBack}
          fileInputRef={fileRef}
        />
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function CanvasEditor({ mockupUrl, mockupUrlBack, side, onSideChange, productName, printArea, printAreaBack }: CanvasEditorProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasMapRef  = useRef<Record<string, fabric.Canvas>>({});
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

  const handleSideChange = (s: 'front' | 'back') => {
    onSideChange?.(s);
  };

  return (
    <>
      <div ref={containerRef} className="w-full select-none">
        {/* Canvas preview — su mobile è cliccabile per aprire fullscreen */}
        <div
          className={`relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-md ${isMobile ? 'cursor-pointer' : ''}`}
          style={{ width: displaySize, height: displaySize }}
          onClick={isMobile ? () => setFullscreen(true) : undefined}
        >
          <SingleFabricCanvas
            mockupUrl={mockupUrl}
            side="front"
            visible={side === 'front'}
            printArea={printArea}
            displaySize={displaySize}
            onReady={handleReady}
          />
          <SingleFabricCanvas
            mockupUrl={mockupUrlBack ?? mockupUrl}
            side="back"
            visible={side === 'back'}
            printArea={printAreaBack ?? printArea}
            displaySize={displaySize}
            onReady={handleReady}
          />

          {/* Badge lato */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wide pointer-events-none">
            {side === 'front' ? '● FRONTE' : '● RETRO'}
          </div>

          {/* Dimensioni */}
          {(printArea || printAreaBack) && (
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 pointer-events-none shadow-sm">
              {(side === 'front' ? printArea : (printAreaBack ?? printArea))?.widthCm} × {(side === 'front' ? printArea : (printAreaBack ?? printArea))?.heightCm} cm
            </div>
          )}

          {/* Tap to edit — overlay mobile */}
          {isMobile && (
            <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
              <div className="bg-gray-900/80 backdrop-blur-sm text-white text-sm font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg">
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
          onSideChange={handleSideChange}
          onClose={() => setFullscreen(false)}
          printArea={printArea}
          printAreaBack={printAreaBack}
          canvasMapRef={canvasMapRef}
          onReady={handleReady}
        />
      )}
    </>
  );
}
