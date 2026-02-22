'use client';

/**
 * CONFIGURATORE PROFESSIONALE — Pattern Printful/Printify
 * 
 * Approccio:
 * - Fabric.js per desktop (pieno controllo)
 * - CSS transform + touch events nativi per mobile
 * - Auto-centra il design nell'area di stampa
 * - Zero terminologia tecnica per l'utente
 */

import { useEffect, useRef, useState, useCallback, TouchEvent } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';
import { Upload, Type, ZoomIn, ZoomOut, RotateCw, Trash2 } from 'lucide-react';

interface CanvasEditorProps {
  mockupUrl: string;
  side: 'front' | 'back';
  productName: string;
  printArea?: PrintAreaDimensions;
}

const LOGICAL = 500;
const designStorage: Record<string, any> = {};

// ─────────────────────────────────────────────────────────────────
// Componente unico che si adatta: desktop = Fabric, mobile = CSS
// ─────────────────────────────────────────────────────────────────
export function CanvasEditor({ mockupUrl, side, productName, printArea }: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState(LOGICAL);
  const isMobile = displaySize < 500;

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

  return (
    <div ref={containerRef} className="w-full">
      {isMobile
        ? <MobileEditor mockupUrl={mockupUrl} side={side} productName={productName} printArea={printArea} displaySize={displaySize} />
        : <DesktopEditor mockupUrl={mockupUrl} side={side} productName={productName} printArea={printArea} displaySize={displaySize} />
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MOBILE EDITOR — CSS transform, touch nativo, ultra-semplice
// Pattern: Printful mobile
// ─────────────────────────────────────────────────────────────────
interface DesignElement {
  type: 'image' | 'text';
  src?: string;       // per immagini
  text?: string;      // per testo
  x: number;          // % rispetto all'area di stampa
  y: number;
  scale: number;
  rotation: number;
}

const mobileStorage: Record<string, DesignElement | null> = {};

function MobileEditor({ mockupUrl, side, productName, printArea, displaySize }: CanvasEditorProps & { displaySize: number }) {
  const storageKey = `mobile-${side}`;
  const [design, setDesign] = useState<DesignElement | null>(mobileStorage[storageKey] ?? null);
  const [selected, setSelected] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchRef = useRef<{ dist: number; origScale: number } | null>(null);

  // Salva nel storage globale
  useEffect(() => { mobileStorage[storageKey] = design; }, [design, storageKey]);

  // Calcola area di stampa in pixel sul display
  const printAreaPx = {
    left:   displaySize * (printArea?.xPercent   ?? 25) / 100,
    top:    displaySize * (printArea?.yPercent    ?? 20) / 100,
    width:  displaySize * (printArea?.widthPercent  ?? 50) / 100,
    height: displaySize * (printArea?.heightPercent ?? 45) / 100,
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setDesign({
        type: 'image',
        src: e.target?.result as string,
        x: 50, y: 50,    // centrato nell'area di stampa
        scale: 1,
        rotation: 0,
      });
      setSelected(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => {
    setDesign({
      type: 'text',
      text: 'Il tuo testo',
      x: 50, y: 50,
      scale: 1,
      rotation: 0,
    });
    setSelected(true);
  };

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setSelected(true);
    if (e.touches.length === 1) {
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        origX: design?.x ?? 50,
        origY: design?.y ?? 50,
      };
    } else if (e.touches.length === 2 && design) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        dist: Math.sqrt(dx * dx + dy * dy),
        origScale: design.scale,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!design) return;

    if (e.touches.length === 1 && dragRef.current) {
      const deltaX = (e.touches[0].clientX - dragRef.current.startX) / printAreaPx.width * 100;
      const deltaY = (e.touches[0].clientY - dragRef.current.startY) / printAreaPx.height * 100;
      setDesign(d => d ? { ...d,
        x: Math.max(5, Math.min(95, dragRef.current!.origX + deltaX)),
        y: Math.max(5, Math.min(95, dragRef.current!.origY + deltaY)),
      } : d);
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchRef.current.dist;
      setDesign(d => d ? { ...d,
        scale: Math.max(0.2, Math.min(3, pinchRef.current!.origScale * ratio)),
      } : d);
    }
  };

  const onTouchEnd = () => {
    dragRef.current = null;
    pinchRef.current = null;
  };

  // Mouse drag per desktop fallback
  const mouseRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(true);
    mouseRef.current = { startX: e.clientX, startY: e.clientY, origX: design?.x ?? 50, origY: design?.y ?? 50 };
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseRef.current || !design) return;
    const deltaX = (e.clientX - mouseRef.current.startX) / printAreaPx.width * 100;
    const deltaY = (e.clientY - mouseRef.current.startY) / printAreaPx.height * 100;
    setDesign(d => d ? { ...d,
      x: Math.max(5, Math.min(95, mouseRef.current!.origX + deltaX)),
      y: Math.max(5, Math.min(95, mouseRef.current!.origY + deltaY)),
    } : d);
  }, [design, printAreaPx.width, printAreaPx.height]);
  const onMouseUp = useCallback(() => { mouseRef.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [onMouseMove, onMouseUp]);

  // Reset
  useEffect(() => {
    const handleReset = () => { setDesign(null); setSelected(false); };
    window.addEventListener('resetCanvas', handleReset);
    return () => window.removeEventListener('resetCanvas', handleReset);
  }, []);

  // Esponi preview
  useEffect(() => {
    (window as any).fabricCanvas = {
      toDataURL: () => null, // preview generata separatamente se necessario
      _mobileDesign: design,
      _side: side,
    };
  }, [design, side]);

  return (
    <div className="w-full select-none">
      {/* Mockup con area di stampa */}
      <div
        className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        style={{ width: displaySize, height: displaySize }}
        onClick={() => setSelected(false)}
      >
        {/* Mockup */}
        <img
          src={mockupUrl}
          alt={productName}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Area di stampa — highlight leggero */}
        <div
          className="absolute border-2 border-dashed border-green-400/60 rounded-sm pointer-events-none"
          style={{
            left: printAreaPx.left, top: printAreaPx.top,
            width: printAreaPx.width, height: printAreaPx.height,
          }}
        />

        {/* Design element */}
        {design && (
          <div
            className={`absolute cursor-grab active:cursor-grabbing ${selected ? 'outline outline-2 outline-offset-2 outline-orange-500' : ''}`}
            style={{
              left: printAreaPx.left + printAreaPx.width * design.x / 100,
              top:  printAreaPx.top  + printAreaPx.height * design.y / 100,
              transform: `translate(-50%, -50%) scale(${design.scale}) rotate(${design.rotation}deg)`,
              transformOrigin: 'center',
              touchAction: 'none',
              maxWidth: printAreaPx.width * 0.9,
              maxHeight: printAreaPx.height * 0.9,
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
          >
            {design.type === 'image' && design.src && (
              <img
                src={design.src}
                alt="design"
                className="pointer-events-none"
                style={{ width: printAreaPx.width * 0.6, height: 'auto', display: 'block' }}
                draggable={false}
              />
            )}
            {design.type === 'text' && (
              <div
                className="font-bold text-white pointer-events-none whitespace-nowrap"
                style={{
                  fontSize: Math.max(16, printAreaPx.width * 0.1),
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                {design.text}
              </div>
            )}
          </div>
        )}

        {/* Badge lato */}
        <div className="absolute top-3 right-3 bg-gray-900/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold pointer-events-none">
          {side === 'front' ? '👕 Fronte' : '🔄 Retro'}
        </div>

        {/* Placeholder se vuoto */}
        {!design && (
          <div
            className="absolute flex flex-col items-center justify-center text-gray-400 pointer-events-none"
            style={{
              left: printAreaPx.left, top: printAreaPx.top,
              width: printAreaPx.width, height: printAreaPx.height,
            }}
          >
            <Upload className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs text-center opacity-60">Carica la tua immagine</p>
          </div>
        )}
      </div>

      {/* Toolbar semplificata MOBILE */}
      <div className="mt-3 flex gap-2">
        {/* Upload immagine */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 text-sm font-semibold shadow-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          {design?.type === 'image' ? 'Cambia immagine' : 'Carica immagine'}
        </button>

        {/* Aggiungi testo */}
        <button
          onClick={handleAddText}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold shadow-sm transition-colors"
        >
          <Type className="w-4 h-4" />
          Testo
        </button>

        {/* Elimina */}
        {design && (
          <button
            onClick={() => { setDesign(null); setSelected(false); }}
            className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-xl px-4 py-3 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Controlli scala/rotazione — solo se c'è un design */}
      {design && selected && (
        <div className="mt-2 flex gap-2">
          <button onClick={() => setDesign(d => d ? { ...d, scale: Math.min(3, d.scale + 0.1) } : d)}
            className="flex-1 flex items-center justify-center gap-1 border rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
            <ZoomIn className="w-4 h-4" />Ingrandisci
          </button>
          <button onClick={() => setDesign(d => d ? { ...d, scale: Math.max(0.2, d.scale - 0.1) } : d)}
            className="flex-1 flex items-center justify-center gap-1 border rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
            <ZoomOut className="w-4 h-4" />Riduci
          </button>
          <button onClick={() => setDesign(d => d ? { ...d, rotation: (d.rotation + 15) % 360 } : d)}
            className="flex items-center justify-center border rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hint drag */}
      {design && !selected && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Tocca il design per selezionarlo • Trascina per spostare • Pizzica per ridimensionare
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DESKTOP EDITOR — Fabric.js completo
// ─────────────────────────────────────────────────────────────────
function DesktopEditor({ mockupUrl, side, productName, printArea, displaySize }: CanvasEditorProps & { displaySize: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const imgRef    = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isReady, setIsReady]     = useState(false);
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
      left:   imgX + imgW * (printArea?.xPercent ?? 25) / 100,
      top:    imgY + imgH * (printArea?.yPercent ?? 20) / 100,
      width:  imgW * (printArea?.widthPercent ?? 50) / 100,
      height: imgH * (printArea?.heightPercent ?? 45) / 100,
    };
  }, [printArea]);

  useEffect(() => {
    if (!canvasRef.current || !imgLoaded) return;
    if (fabricRef.current) {
      const objs = fabricRef.current.getObjects().filter(o => (o as any).name !== 'printArea');
      if (objs.length > 0) designStorage[storageKey] = fabricRef.current.toJSON(['name']);
      else delete designStorage[storageKey];
      fabricRef.current.dispose();
      fabricRef.current = null;
      setIsReady(false);
    }
    const timer = setTimeout(() => {
      if (!canvasRef.current) return;
      const coords = getPrintCoords();
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: LOGICAL, height: LOGICAL,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        enableRetinaScaling: true,
      });
      fabricRef.current = canvas;
      (window as any).fabricCanvas = canvas;

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

      const zoom = displaySize / LOGICAL;
      canvas.setZoom(zoom); canvas.setWidth(displaySize); canvas.setHeight(displaySize);
      canvas.requestRenderAll();
      setIsReady(true);

      return () => { clearTimeout(saveTimer); window.removeEventListener('resetCanvas', handleReset); save(); canvas.dispose(); };
    }, 100);
    return () => clearTimeout(timer);
  }, [side, printArea, imgLoaded]);

  useEffect(() => {
    if (!fabricRef.current || !isReady) return;
    const zoom = displaySize / LOGICAL;
    fabricRef.current.setZoom(zoom);
    fabricRef.current.setWidth(displaySize);
    fabricRef.current.setHeight(displaySize);
    fabricRef.current.requestRenderAll();
  }, [displaySize, isReady]);

  return (
    <div className="relative w-full select-none">
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        style={{ width: displaySize, height: displaySize }}>
        <img ref={imgRef} src={mockupUrl} alt={productName}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
          onLoad={() => { setImgLoaded(false); setTimeout(() => setImgLoaded(true), 50); }} />
        <div className="absolute inset-0 touch-none"><canvas ref={canvasRef} /></div>
        <div className="absolute top-3 right-3 bg-gray-900/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold pointer-events-none">
          {side === 'front' ? '👕 Fronte' : '🔄 Retro'}
        </div>
        {printArea && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-gray-600 shadow pointer-events-none">
            {printArea.widthCm} × {printArea.heightCm} cm
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Trascina per spostare • Scorri per ridimensionare • Ruota con le maniglie
      </p>
    </div>
  );
}
