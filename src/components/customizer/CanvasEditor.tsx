'use client';

/**
 * CanvasEditor — SEMPLICE e DEFINITIVO
 * 
 * - Due istanze Fabric.js sempre montate (front/back), switch via CSS
 * - Zoom corretto via canvas.setZoom()
 * - Espone window.fabricCanvas sempre aggiornato
 * - Nessuna toolbar inline — la gestisce Toolbar.tsx separatamente
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';

interface CanvasEditorProps {
  mockupUrl: string;
  side: 'front' | 'back';
  productName: string;
  printArea?: PrintAreaDimensions;
  printAreaBack?: PrintAreaDimensions;
}

const LOGICAL = 500;
const designStorage: Record<string, any> = {};

function SingleFabricCanvas({
  mockupUrl, side, visible, printArea, displaySize, onReady,
}: {
  mockupUrl: string;
  side: 'front' | 'back';
  visible: boolean;
  printArea?: PrintAreaDimensions;
  displaySize: number;
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

  // Init una sola volta quando l'immagine è caricata
  useEffect(() => {
    if (!canvasRef.current || !imgLoaded || fabricRef.current) return;

    const timer = setTimeout(() => {
      if (!canvasRef.current) return;
      const coords = getCoords();

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: LOGICAL,
        height: LOGICAL,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        allowTouchScrolling: false,
      });
      fabricRef.current = canvas;

      // ClipPath — il design non esce dall'area di stampa
      canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });

      // Bordo area di stampa visivo
      const printRect = new fabric.Rect({
        ...coords,
        fill: 'rgba(16,185,129,0.04)',
        stroke: '#10b981',
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        selectable: false,
        evented: false,
        name: 'printArea',
      });
      canvas.add(printRect);
      canvas.sendToBack(printRect);

      // Maniglie professionali
      fabric.Object.prototype.set({
        cornerSize: 14,
        cornerStyle: 'circle',
        borderColor: '#f97316',
        cornerColor: '#f97316',
        cornerStrokeColor: '#ffffff',
        transparentCorners: false,
        borderScaleFactor: 1.5,
        padding: 6,
        hasRotatingPoint: true,
      });

      // Vincola all'area di stampa
      const constrain = (obj: fabric.Object) => {
        if ((obj as any).name === 'printArea') return;
        const b = obj.getBoundingRect();
        const vis = 0.25;
        const { left: px, top: py, width: pw, height: ph } = coords;
        let l = obj.left ?? 0, t = obj.top ?? 0;
        if (b.left < px - b.width * vis)        l = px - b.width * vis + (l - b.left);
        if (b.top  < py - b.height * vis)        t = py - b.height * vis + (t - b.top);
        if (b.left > px + pw - b.width * vis)    l = px + pw - b.width * vis + (l - b.left);
        if (b.top  > py + ph - b.height * vis)   t = py + ph - b.height * vis + (t - b.top);
        obj.set({ left: l, top: t });
        obj.setCoords();
      };
      canvas.on('object:moving',   e => constrain(e.target as fabric.Object));
      canvas.on('object:scaling',  e => constrain(e.target as fabric.Object));
      canvas.on('object:rotating', e => constrain(e.target as fabric.Object));

      // Autosave
      let st: NodeJS.Timeout;
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

      // Ripristina design salvato
      const saved = designStorage[storageKey];
      if (saved) {
        canvas.loadFromJSON(saved, () => {
          const pa = canvas.getObjects().find(o => (o as any).name === 'printArea');
          if (pa) canvas.sendToBack(pa);
          canvas.requestRenderAll();
        });
      }

      // Reset
      const reset = () => {
        canvas.clear();
        canvas.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
        canvas.add(new fabric.Rect({
          ...coords, fill: 'rgba(16,185,129,0.04)', stroke: '#10b981',
          strokeWidth: 1.5, strokeDashArray: [6, 4],
          selectable: false, evented: false, name: 'printArea',
        }));
        canvas.sendToBack(canvas.getObjects()[0]);
        delete designStorage[storageKey];
        canvas.requestRenderAll();
      };
      window.addEventListener('resetCanvas', reset);
      window.addEventListener(`resetCanvas-${side}`, reset);

      // Zoom iniziale
      const zoom = displaySize / LOGICAL;
      canvas.setZoom(zoom);
      canvas.setWidth(displaySize);
      canvas.setHeight(displaySize);
      canvas.requestRenderAll();

      onReady(side, canvas);
    }, 80);

    return () => clearTimeout(timer);
  }, [imgLoaded]); // solo imgLoaded — no reinit su cambio lato

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
    <div style={{ display: visible ? 'block' : 'none', position: 'absolute', inset: 0 }}>
      <img
        ref={imgRef}
        src={mockupUrl}
        alt="mockup"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        draggable={false}
        onLoad={() => { setImgLoaded(false); setTimeout(() => setImgLoaded(true), 40); }}
      />
      <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export function CanvasEditor({
  mockupUrl, side, productName, printArea, printAreaBack,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMapRef = useRef<Record<string, fabric.Canvas>>({});

  const [displaySize, setDisplaySize] = useState(() =>
    typeof window !== 'undefined'
      ? Math.min(window.innerWidth - 32, LOGICAL)
      : LOGICAL
  );

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

  // Aggiorna fabricCanvas quando cambia lato
  useEffect(() => {
    const c = canvasMapRef.current[side];
    if (c) (window as any).fabricCanvas = c;
  }, [side]);

  return (
    <div ref={containerRef} className="w-full select-none">
      {/* Canvas wrapper — aspect square */}
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
          onReady={handleReady}
        />
        <SingleFabricCanvas
          mockupUrl={mockupUrl}
          side="back"
          visible={side === 'back'}
          printArea={printAreaBack ?? printArea}
          displaySize={displaySize}
          onReady={handleReady}
        />

        {/* Badge lato attivo */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wide pointer-events-none">
          {side === 'front' ? '● FRONTE' : '● RETRO'}
        </div>

        {/* Dimensioni stampa */}
        {(printArea || printAreaBack) && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 pointer-events-none shadow-sm">
            {(side === 'front' ? printArea : (printAreaBack ?? printArea))?.widthCm} × {(side === 'front' ? printArea : (printAreaBack ?? printArea))?.heightCm} cm
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-2.5">
        Trascina per spostare · Usa le maniglie per ridimensionare e ruotare
      </p>
    </div>
  );
}
