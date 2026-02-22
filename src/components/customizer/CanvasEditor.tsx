'use client';

/**
 * CanvasEditor — due canvas sempre montati (front + back)
 * visibilità gestita via CSS display:none
 * → nessun reinit, nessuna perdita design, area stampa stabile
 */

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

// Design persistente per tutta la sessione
const designStorage: Record<string, any> = {};

// ─── SINGLE CANVAS INSTANCE ──────────────────────────────────────────────────
// Un canvas per ogni "slot" (front/back) — non viene mai distrutto al cambio lato

interface SingleCanvasProps {
  mockupUrl: string;
  side: 'front' | 'back';
  visible: boolean;
  productName: string;
  printArea?: PrintAreaDimensions;
  displaySize: number;
  onReady: (side: 'front' | 'back', canvas: fabric.Canvas) => void;
}

function SingleCanvas({ mockupUrl, side, visible, productName, printArea, displaySize, onReady }: SingleCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const fabricRef  = useRef<fabric.Canvas | null>(null);
  const imgRef     = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const storageKey = `design-${side}`;

  const getPrintCoords = useCallback(() => {
    const img = imgRef.current;
    let imgX = 0, imgY = 0, imgW = LOGICAL, imgH = LOGICAL;
    if (img?.naturalWidth && img?.naturalHeight) {
      const r = img.naturalWidth / img.naturalHeight;
      if (r >= 1) { imgW = LOGICAL; imgH = LOGICAL / r; imgY = (LOGICAL - imgH) / 2; }
      else        { imgH = LOGICAL; imgW = LOGICAL * r;  imgX = (LOGICAL - imgW) / 2; }
    }
    return {
      left:   imgX + imgW * (printArea?.xPercent    ?? 25) / 100,
      top:    imgY + imgH * (printArea?.yPercent     ?? 20) / 100,
      width:  imgW * (printArea?.widthPercent  ?? 50) / 100,
      height: imgH * (printArea?.heightPercent ?? 45) / 100,
    };
  }, [printArea]);

  // Init canvas — una sola volta quando l'immagine è caricata
  useEffect(() => {
    if (!canvasRef.current || !imgLoaded) return;
    if (fabricRef.current) return; // già inizializzato

    const timer = setTimeout(() => {
      if (!canvasRef.current) return;
      const coords = getPrintCoords();

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: LOGICAL, height: LOGICAL,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        selection: true,
      });
      fabricRef.current = canvas;

      // ClipPath
      canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });

      // Bordo area stampa
      const printRect = new fabric.Rect({
        ...coords, fill: 'transparent',
        stroke: '#10b981', strokeWidth: 2, strokeDashArray: [8, 4],
        selectable: false, evented: false, name: 'printArea',
      });
      canvas.add(printRect);
      canvas.sendToBack(printRect);

      // Maniglie
      fabric.Object.prototype.set({
        cornerSize: 20, cornerStyle: 'circle',
        borderColor: '#f97316', cornerColor: '#f97316',
        cornerStrokeColor: '#fff', transparentCorners: false,
        borderScaleFactor: 2, padding: 6,
      });

      // Vincola all'area stampa
      const constrain = (obj: fabric.Object) => {
        if ((obj as any).name === 'printArea') return;
        const b = obj.getBoundingRect();
        const vis = 0.3;
        const { left: px, top: py, width: pw, height: ph } = coords;
        let l = obj.left ?? 0, t = obj.top ?? 0;
        if (b.left < px - b.width * vis)      l = px - b.width * vis + (l - b.left);
        if (b.top  < py - b.height * vis)     t = py - b.height * vis + (t - b.top);
        if (b.left > px + pw - b.width * vis) l = px + pw - b.width * vis + (l - b.left);
        if (b.top  > py + ph - b.height * vis)t = py + ph - b.height * vis + (t - b.top);
        obj.set({ left: l, top: t }); obj.setCoords();
      };
      canvas.on('object:moving',  e => constrain(e.target as fabric.Object));
      canvas.on('object:scaling', e => constrain(e.target as fabric.Object));
      canvas.on('object:rotating', e => constrain(e.target as fabric.Object));

      // Autosave
      let saveTimer: NodeJS.Timeout;
      const save = () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const objs = canvas.getObjects().filter(o => (o as any).name !== 'printArea');
          if (objs.length > 0) designStorage[storageKey] = canvas.toJSON(['name']);
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
          canvas.requestRenderAll();
        });
      }

      // Reset event
      const handleReset = () => {
        canvas.clear();
        canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
        canvas.add(new fabric.Rect({
          ...coords, fill: 'transparent',
          stroke: '#10b981', strokeWidth: 2, strokeDashArray: [8, 4],
          selectable: false, evented: false, name: 'printArea',
        }));
        canvas.sendToBack(canvas.getObjects()[0]);
        delete designStorage[storageKey];
        canvas.requestRenderAll();
      };
      window.addEventListener(`resetCanvas-${side}`, handleReset);
      window.addEventListener('resetCanvas', handleReset);

      // Applica zoom
      const zoom = displaySize / LOGICAL;
      canvas.setZoom(zoom);
      canvas.setWidth(displaySize);
      canvas.setHeight(displaySize);
      canvas.requestRenderAll();

      onReady(side, canvas);
    }, 80);

    return () => clearTimeout(timer);
  }, [imgLoaded]); // ← SOLO imgLoaded, non side/printArea → nessun reinit

  // Aggiorna zoom senza reinit
  useEffect(() => {
    if (!fabricRef.current) return;
    const zoom = displaySize / LOGICAL;
    fabricRef.current.setZoom(zoom);
    fabricRef.current.setWidth(displaySize);
    fabricRef.current.setHeight(displaySize);
    fabricRef.current.requestRenderAll();
  }, [displaySize]);

  return (
    <div style={{ display: visible ? 'block' : 'none', position: 'relative', width: displaySize, height: displaySize }}>
      <img
        ref={imgRef}
        src={mockupUrl}
        alt={`${productName} ${side}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
        draggable={false}
        onLoad={() => { setImgLoaded(false); setTimeout(() => setImgLoaded(true), 30); }}
      />
      <div style={{ position: 'absolute', inset: 0 }}>
        <canvas ref={canvasRef} />
      </div>
      {printArea && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 8, fontSize: 12, color: '#555', pointerEvents: 'none' }}>
          {printArea.widthCm} × {printArea.heightCm} cm
        </div>
      )}
    </div>
  );
}

// ─── MOBILE EDITOR ────────────────────────────────────────────────────────────

interface MobileDesign {
  type: 'image' | 'text';
  src?: string;
  text?: string;
  x: number; y: number;
  scale: number;
  rotation: number;
}

const mobileStorage: Record<string, MobileDesign | null> = {};

function MobileEditor({ mockupUrl, side, productName, printArea, displaySize }: {
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

  const handleUpload = (file: File) => {
    const r = new FileReader();
    r.onload = e => {
      setDesign({ type: 'image', src: e.target?.result as string, x: 50, y: 50, scale: 1, rotation: 0 });
      setSelected(true);
    };
    r.readAsDataURL(file);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation(); setSelected(true);
    if (e.touches.length === 1) {
      dragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, ox: design?.x ?? 50, oy: design?.y ?? 50 };
    } else if (e.touches.length === 2 && design) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx*dx + dy*dy), os: design.scale };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!design) return;
    if (e.touches.length === 1 && dragRef.current) {
      const dx = (e.touches[0].clientX - dragRef.current.sx) / pa.width * 100;
      const dy = (e.touches[0].clientY - dragRef.current.sy) / pa.height * 100;
      setDesign(d => d ? { ...d, x: Math.max(5, Math.min(95, dragRef.current!.ox + dx)), y: Math.max(5, Math.min(95, dragRef.current!.oy + dy)) } : d);
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const ratio = Math.sqrt(dx*dx + dy*dy) / pinchRef.current.dist;
      setDesign(d => d ? { ...d, scale: Math.max(0.2, Math.min(3, pinchRef.current!.os * ratio)) } : d);
    }
  };
  const onTouchEnd = () => { dragRef.current = null; pinchRef.current = null; };

  useEffect(() => {
    const handleReset = () => { setDesign(null); setSelected(false); };
    window.addEventListener('resetCanvas', handleReset);
    window.addEventListener(`resetCanvas-${side}`, handleReset);
    return () => { window.removeEventListener('resetCanvas', handleReset); window.removeEventListener(`resetCanvas-${side}`, handleReset); };
  }, [side]);

  useEffect(() => {
    (window as any).fabricCanvas = { toDataURL: () => null, _mobileDesign: design, _side: side };
  }, [design, side]);

  return (
    <div className="w-full">
      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        style={{ width: displaySize, height: displaySize }} onClick={() => setSelected(false)}>
        <img src={mockupUrl} alt={productName}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable={false} />
        {/* Area stampa */}
        <div className="absolute border-2 border-dashed border-green-400/50 rounded pointer-events-none"
          style={{ left: pa.left, top: pa.top, width: pa.width, height: pa.height }} />
        {/* Design */}
        {design && (
          <div
            className={`absolute cursor-grab ${selected ? 'outline outline-2 outline-offset-1 outline-orange-500 rounded' : ''}`}
            style={{
              left: pa.left + pa.width * design.x / 100, top: pa.top + pa.height * design.y / 100,
              transform: `translate(-50%,-50%) scale(${design.scale}) rotate(${design.rotation}deg)`,
              transformOrigin: 'center', touchAction: 'none',
            }}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {design.type === 'image' && design.src && (
              <img src={design.src} alt="design" draggable={false}
                style={{ width: pa.width * 0.55, height: 'auto', display: 'block', pointerEvents: 'none' }} />
            )}
            {design.type === 'text' && (
              <div className="font-bold text-white pointer-events-none whitespace-nowrap"
                style={{ fontSize: Math.max(16, pa.width * 0.1), textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                {design.text}
              </div>
            )}
          </div>
        )}
        {!design && (
          <div className="absolute flex flex-col items-center justify-center text-gray-400 pointer-events-none"
            style={{ left: pa.left, top: pa.top, width: pa.width, height: pa.height }}>
            <Upload className="w-7 h-7 mb-1 opacity-30" />
            <p className="text-xs opacity-50">Carica immagine</p>
          </div>
        )}
        {printArea && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-gray-500 pointer-events-none">
            {printArea.widthCm} × {printArea.heightCm} cm
          </div>
        )}
      </div>

      {/* Toolbar mobile */}
      <div className="mt-3 flex gap-2">
        <button onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors">
          <Upload className="w-4 h-4" />{design?.type === 'image' ? 'Cambia' : 'Carica immagine'}
        </button>
        <button onClick={() => { setDesign({ type: 'text', text: 'Il tuo testo', x: 50, y: 50, scale: 1, rotation: 0 }); setSelected(true); }}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold transition-colors">
          <Type className="w-4 h-4" />Testo
        </button>
        {design && (
          <button onClick={() => { setDesign(null); setSelected(false); }}
            className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-xl px-4 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {design && selected && (
        <div className="mt-2 flex gap-2">
          <button onClick={() => setDesign(d => d ? { ...d, scale: Math.min(3, d.scale + 0.15) } : d)}
            className="flex-1 flex items-center justify-center gap-1 border rounded-xl py-2.5 text-sm hover:bg-gray-50">
            <ZoomIn className="w-4 h-4" />Ingrandisci
          </button>
          <button onClick={() => setDesign(d => d ? { ...d, scale: Math.max(0.2, d.scale - 0.15) } : d)}
            className="flex-1 flex items-center justify-center gap-1 border rounded-xl py-2.5 text-sm hover:bg-gray-50">
            <ZoomOut className="w-4 h-4" />Riduci
          </button>
          <button onClick={() => setDesign(d => d ? { ...d, rotation: (d.rotation + 15) % 360 } : d)}
            className="flex items-center justify-center border rounded-xl px-3 hover:bg-gray-50">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      )}
      {design && !selected && (
        <p className="text-xs text-gray-400 text-center mt-2">Tocca per selezionare • Trascina per spostare • Pizzica per ridimensionare</p>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CanvasEditor({ mockupUrl, side, productName, printArea, printAreaBack }: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState(LOGICAL);
  const canvasMapRef = useRef<Record<string, fabric.Canvas>>({});
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

  // Quando cambia lato, aggiorna window.fabricCanvas
  useEffect(() => {
    const canvas = canvasMapRef.current[side];
    if (canvas) (window as any).fabricCanvas = canvas;
  }, [side]);

  const handleCanvasReady = (s: 'front' | 'back', canvas: fabric.Canvas) => {
    canvasMapRef.current[s] = canvas;
    if (s === side) (window as any).fabricCanvas = canvas;
  };

  return (
    <div ref={containerRef} className="w-full">
      {isMobile ? (
        // MOBILE: due MobileEditor separati, visibilità CSS
        <div>
          <div style={{ display: side === 'front' ? 'block' : 'none' }}>
            <MobileEditor mockupUrl={mockupUrl} side="front" productName={productName}
              printArea={printArea} displaySize={displaySize} />
          </div>
          <div style={{ display: side === 'back' ? 'block' : 'none' }}>
            <MobileEditor mockupUrl={mockupUrl} side="back" productName={productName}
              printArea={printAreaBack ?? printArea} displaySize={displaySize} />
          </div>
        </div>
      ) : (
        // DESKTOP: due SingleCanvas sempre montati, visibilità CSS
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          style={{ width: displaySize, height: displaySize }}>
          <SingleCanvas mockupUrl={mockupUrl} side="front" visible={side === 'front'}
            productName={productName} printArea={printArea}
            displaySize={displaySize} onReady={handleCanvasReady} />
          <SingleCanvas mockupUrl={mockupUrl} side="back" visible={side === 'back'}
            productName={productName} printArea={printAreaBack ?? printArea}
            displaySize={displaySize} onReady={handleCanvasReady} />
          {/* Badge lato */}
          <div className="absolute top-3 right-3 bg-gray-900/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold pointer-events-none">
            {side === 'front' ? '👕 Fronte' : '🔄 Retro'}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 text-center mt-2">
        {isMobile ? 'Tocca per selezionare • Trascina • Pizzica per ridimensionare'
                  : 'Trascina per spostare • Usa le maniglie per ridimensionare'}
      </p>
    </div>
  );
}
