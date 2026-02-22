'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';
import { Upload, Type, Trash2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface CanvasEditorProps {
  mockupUrl: string;
  side: 'front' | 'back';
  productName: string;
  printArea?: PrintAreaDimensions;
  printAreaBack?: PrintAreaDimensions;
}

const LOGICAL = 500;
const designStorage: Record<string, any> = {};

// ─── DESKTOP: Fabric.js — due istanze sempre montate ─────────────────────────

function DesktopCanvas({ mockupUrl, side, visible, productName, printArea, displaySize, onReady }: {
  mockupUrl: string; side: 'front' | 'back'; visible: boolean;
  productName: string; printArea?: PrintAreaDimensions;
  displaySize: number; onReady: (side: 'front' | 'back', c: fabric.Canvas) => void;
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
      width:  iW * (printArea?.widthPercent  ?? 50) / 100,
      height: iH * (printArea?.heightPercent ?? 45) / 100,
    };
  }, [printArea]);

  // Init una sola volta
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
      });
      fabricRef.current = canvas;

      canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
      canvas.add(new fabric.Rect({
        ...coords, fill: 'transparent',
        stroke: '#10b981', strokeWidth: 2, strokeDashArray: [8, 4],
        selectable: false, evented: false, name: 'printArea',
      }));
      canvas.sendToBack(canvas.getObjects()[0]);

      fabric.Object.prototype.set({
        cornerSize: 12, cornerStyle: 'circle',
        borderColor: '#f97316', cornerColor: '#f97316',
        cornerStrokeColor: '#fff', transparentCorners: false,
        borderScaleFactor: 2, padding: 4,
      });

      const constrain = (obj: fabric.Object) => {
        if ((obj as any).name === 'printArea') return;
        const b = obj.getBoundingRect();
        const vis = 0.3;
        const { left: px, top: py, width: pw, height: ph } = coords;
        let l = obj.left ?? 0, t = obj.top ?? 0;
        if (b.left < px - b.width * vis)       l = px - b.width * vis + (l - b.left);
        if (b.top  < py - b.height * vis)       t = py - b.height * vis + (t - b.top);
        if (b.left > px + pw - b.width * vis)   l = px + pw - b.width * vis + (l - b.left);
        if (b.top  > py + ph - b.height * vis)  t = py + ph - b.height * vis + (t - b.top);
        obj.set({ left: l, top: t }); obj.setCoords();
      };
      canvas.on('object:moving',  e => constrain(e.target as fabric.Object));
      canvas.on('object:scaling', e => constrain(e.target as fabric.Object));
      canvas.on('object:rotating', e => constrain(e.target as fabric.Object));

      let st: NodeJS.Timeout;
      const save = () => { clearTimeout(st); st = setTimeout(() => {
        const objs = canvas.getObjects().filter(o => (o as any).name !== 'printArea');
        if (objs.length > 0) designStorage[storageKey] = canvas.toJSON(['name']);
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

      const handleReset = () => {
        canvas.clear();
        canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
        canvas.add(new fabric.Rect({ ...coords, fill: 'transparent', stroke: '#10b981', strokeWidth: 2, strokeDashArray: [8, 4], selectable: false, evented: false, name: 'printArea' }));
        canvas.sendToBack(canvas.getObjects()[0]);
        delete designStorage[storageKey];
        canvas.requestRenderAll();
      };
      window.addEventListener('resetCanvas', handleReset);
      window.addEventListener(`resetCanvas-${side}`, handleReset);

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
      <img ref={imgRef} src={mockupUrl} alt={productName}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        draggable={false}
        onLoad={() => { setImgLoaded(false); setTimeout(() => setImgLoaded(true), 30); }} />
      <div style={{ position: 'absolute', inset: 0 }}><canvas ref={canvasRef} /></div>
      {printArea && (
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: 6, fontSize: 11, color: '#666', pointerEvents: 'none' }}>
          {printArea.widthCm} × {printArea.heightCm} cm
        </div>
      )}
    </div>
  );
}

// ─── MOBILE: CSS transform + touch nativo ────────────────────────────────────

interface MobileDesign { type: 'image' | 'text'; src?: string; text?: string; x: number; y: number; scale: number; rotation: number; }
const mobileStorage: Record<string, MobileDesign | null> = {};

function MobileCanvas({ mockupUrl, side, productName, printArea, displaySize }: {
  mockupUrl: string; side: 'front' | 'back'; productName: string;
  printArea?: PrintAreaDimensions; displaySize: number;
}) {
  const storageKey = `mobile-${side}`;
  const [design, setDesign] = useState<MobileDesign | null>(mobileStorage[storageKey] ?? null);
  const [selected, setSelected] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; os: number } | null>(null);

  useEffect(() => { mobileStorage[storageKey] = design; }, [design, storageKey]);

  const pa = {
    left:   displaySize * (printArea?.xPercent    ?? 25) / 100,
    top:    displaySize * (printArea?.yPercent     ?? 20) / 100,
    width:  displaySize * (printArea?.widthPercent  ?? 50) / 100,
    height: displaySize * (printArea?.heightPercent ?? 45) / 100,
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation(); setSelected(true);
    if (e.touches.length === 1)
      dragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: design?.x ?? 50, oy: design?.y ?? 50 };
    else if (e.touches.length === 2 && design) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx*dx+dy*dy), os: design.scale };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.touches.length === 1 && dragRef.current)
      setDesign(d => d ? { ...d,
        x: Math.max(5, Math.min(95, dragRef.current!.ox + (e.touches[0].clientX - dragRef.current!.sx) / pa.width * 100)),
        y: Math.max(5, Math.min(95, dragRef.current!.oy + (e.touches[0].clientY - dragRef.current!.sy) / pa.height * 100)),
      } : d);
    else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setDesign(d => d ? { ...d, scale: Math.max(0.2, Math.min(3, pinchRef.current!.os * Math.sqrt(dx*dx+dy*dy) / pinchRef.current!.dist)) } : d);
    }
  };
  const onTouchEnd = () => { dragRef.current = null; pinchRef.current = null; };

  useEffect(() => {
    const r = () => { setDesign(null); setSelected(false); };
    window.addEventListener('resetCanvas', r);
    window.addEventListener(`resetCanvas-${side}`, r);
    return () => { window.removeEventListener('resetCanvas', r); window.removeEventListener(`resetCanvas-${side}`, r); };
  }, [side]);

  useEffect(() => {
    (window as any).fabricCanvas = { toDataURL: () => null, _mobileDesign: design, _side: side };
  }, [design, side]);

  return (
    <div className="w-full space-y-3">
      {/* Mockup */}
      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        style={{ width: displaySize, height: displaySize }} onClick={() => setSelected(false)}>
        <img src={mockupUrl} alt={productName} className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable={false} />
        <div className="absolute border-2 border-dashed border-green-400/60 pointer-events-none rounded"
          style={{ left: pa.left, top: pa.top, width: pa.width, height: pa.height }} />
        {design && (
          <div className={`absolute cursor-grab ${selected ? 'outline outline-2 outline-orange-500 outline-offset-1 rounded' : ''}`}
            style={{ left: pa.left + pa.width * design.x/100, top: pa.top + pa.height * design.y/100,
              transform: `translate(-50%,-50%) scale(${design.scale}) rotate(${design.rotation}deg)`,
              transformOrigin: 'center', touchAction: 'none' }}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {design.type === 'image' && design.src && (
              <img src={design.src} draggable={false} style={{ width: pa.width * 0.6, height: 'auto', display: 'block', pointerEvents: 'none' }} />
            )}
            {design.type === 'text' && (
              <div className="font-bold text-black pointer-events-none whitespace-nowrap drop-shadow-md"
                style={{ fontSize: Math.max(18, pa.width * 0.1) }}>{design.text}</div>
            )}
          </div>
        )}
        {!design && (
          <div className="absolute flex flex-col items-center justify-center text-gray-400 pointer-events-none gap-2"
            style={{ left: pa.left, top: pa.top, width: pa.width, height: pa.height }}>
            <Upload className="w-8 h-8 opacity-30" />
            <p className="text-xs opacity-50 text-center">Carica la tua immagine<br/>o aggiungi testo</p>
          </div>
        )}
        {printArea && (
          <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded text-xs text-gray-500 pointer-events-none">
            {printArea.widthCm}×{printArea.heightCm}cm
          </div>
        )}
      </div>

      {/* Bottoni principali */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 bg-orange-600 text-white rounded-xl py-4 text-sm font-bold active:scale-95 transition-transform">
          <Upload className="w-5 h-5" />Carica immagine
        </button>
        <button onClick={() => { setDesign({ type: 'text', text: 'Il tuo testo', x: 50, y: 40, scale: 1, rotation: 0 }); setSelected(true); }}
          className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-4 text-sm font-bold active:scale-95 transition-transform">
          <Type className="w-5 h-5" />Aggiungi testo
        </button>
      </div>

      {/* Controlli quando c'è un design */}
      {design && (
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => setDesign(d => d ? { ...d, scale: Math.min(3, d.scale + 0.2) } : d)}
            className="flex flex-col items-center gap-1 border-2 rounded-xl py-3 text-xs font-medium active:bg-gray-100">
            <ZoomIn className="w-5 h-5" />Ingrandisci
          </button>
          <button onClick={() => setDesign(d => d ? { ...d, scale: Math.max(0.2, d.scale - 0.2) } : d)}
            className="flex flex-col items-center gap-1 border-2 rounded-xl py-3 text-xs font-medium active:bg-gray-100">
            <ZoomOut className="w-5 h-5" />Riduci
          </button>
          <button onClick={() => setDesign(d => d ? { ...d, rotation: (d.rotation + 15) % 360 } : d)}
            className="flex flex-col items-center gap-1 border-2 rounded-xl py-3 text-xs font-medium active:bg-gray-100">
            <RotateCw className="w-5 h-5" />Ruota
          </button>
          <button onClick={() => { setDesign(null); setSelected(false); }}
            className="flex flex-col items-center gap-1 border-2 border-red-200 bg-red-50 rounded-xl py-3 text-xs font-medium text-red-600 active:bg-red-100">
            <Trash2 className="w-5 h-5" />Elimina
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Trascina per spostare • Pizzica per ridimensionare
      </p>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && (() => {
          const r = new FileReader();
          r.onload = ev => { setDesign({ type: 'image', src: ev.target?.result as string, x: 50, y: 45, scale: 1, rotation: 0 }); setSelected(true); };
          r.readAsDataURL(e.target.files![0]);
        })()} />
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CanvasEditor({ mockupUrl, side, productName, printArea, printAreaBack }: CanvasEditorProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasMapRef  = useRef<Record<string, fabric.Canvas>>({});

  // Inizializza subito con window.innerWidth per evitare flash
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

  const handleReady = (s: 'front' | 'back', canvas: fabric.Canvas) => {
    canvasMapRef.current[s] = canvas;
    if (s === side) (window as any).fabricCanvas = canvas;
  };

  useEffect(() => {
    const c = canvasMapRef.current[side];
    if (c) (window as any).fabricCanvas = c;
  }, [side]);

  return (
    <div ref={containerRef} className="w-full">
      {isMobile ? (
        // MOBILE — due MobileCanvas separati, switch via display
        <>
          <div style={{ display: side === 'front' ? 'block' : 'none' }}>
            <MobileCanvas mockupUrl={mockupUrl} side="front" productName={productName}
              printArea={printArea} displaySize={displaySize} />
          </div>
          <div style={{ display: side === 'back' ? 'block' : 'none' }}>
            <MobileCanvas mockupUrl={mockupUrl} side="back" productName={productName}
              printArea={printAreaBack ?? printArea} displaySize={displaySize} />
          </div>
        </>
      ) : (
        // DESKTOP — due DesktopCanvas Fabric sempre montati
        <>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            style={{ width: displaySize, height: displaySize }}>
            <DesktopCanvas mockupUrl={mockupUrl} side="front" visible={side === 'front'}
              productName={productName} printArea={printArea}
              displaySize={displaySize} onReady={handleReady} />
            <DesktopCanvas mockupUrl={mockupUrl} side="back" visible={side === 'back'}
              productName={productName} printArea={printAreaBack ?? printArea}
              displaySize={displaySize} onReady={handleReady} />
            <div className="absolute top-3 right-3 bg-gray-900/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold pointer-events-none">
              {side === 'front' ? '👕 Fronte' : '🔄 Retro'}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Trascina per spostare • Usa le maniglie per ridimensionare e ruotare
          </p>
        </>
      )}
    </div>
  );
}
