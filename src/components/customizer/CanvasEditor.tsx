'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';

interface CanvasEditorProps {
  mockupUrl: string;
  side: 'front' | 'back';
  productName: string;
  printArea?: PrintAreaDimensions;
}

// Spazio logico fisso — le coordinate sono SEMPRE relative a 500x500
// Il canvas viene scalato via zoom, mai ridimensionato
const LOGICAL = 500;

// Design salvato separatamente per fronte e retro
const designStorage: Record<string, any> = {};

export function CanvasEditor({ mockupUrl, side, productName, printArea }: CanvasEditorProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const fabricRef    = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded]     = useState(false);
  const [displaySize, setDisplaySize] = useState(LOGICAL);

  const storageKey = `design-${side}`;

  // ── 1. Misura container e aggiorna displaySize ────────────────────────────
  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.offsetWidth;
    setDisplaySize(Math.min(w, LOGICAL));
  }, []);

  useEffect(() => {
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateSize]);

  // ── 2. Calcola coordinate area di stampa (sempre in spazio 500x500) ───────
  const getPrintCoords = useCallback(() => {
    // I valori % sono relativi all'IMMAGINE, non al canvas intero
    // L'immagine è renderizzata con object-contain nel div 500x500
    // Quindi dobbiamo trovare i bounds reali dell'immagine nel canvas
    const img = imgRef.current;
    let imgX = 0, imgY = 0, imgW = LOGICAL, imgH = LOGICAL;

    if (img && img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio > 1) {
        imgW = LOGICAL;
        imgH = LOGICAL / ratio;
        imgY = (LOGICAL - imgH) / 2;
      } else {
        imgH = LOGICAL;
        imgW = LOGICAL * ratio;
        imgX = (LOGICAL - imgW) / 2;
      }
    }

    const xP = printArea?.xPercent   ?? 25;
    const yP = printArea?.yPercent   ?? 20;
    const wP = printArea?.widthPercent  ?? 50;
    const hP = printArea?.heightPercent ?? 45;

    return {
      left:   imgX + imgW * xP / 100,
      top:    imgY + imgH * yP / 100,
      width:  imgW * wP / 100,
      height: imgH * hP / 100,
    };
  }, [printArea]);

  // ── 3. Init/reinit canvas quando cambia side, printArea o immagine ────────
  useEffect(() => {
    if (!canvasRef.current || !imgLoaded) return;

    // Salva stato prima di distruggere
    if (fabricRef.current) {
      const objs = fabricRef.current.getObjects().filter(o => (o as any).name !== 'printArea');
      if (objs.length > 0) designStorage[storageKey] = fabricRef.current.toJSON(['name']);
      else delete designStorage[storageKey];
      fabricRef.current.dispose();
      fabricRef.current = null;
    }

    // Piccolo delay per assicurarsi che l'immagine abbia le dimensioni naturali
    const timer = setTimeout(() => {
      if (!canvasRef.current) return;

      const coords = getPrintCoords();

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: LOGICAL,
        height: LOGICAL,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        selection: true,
      });

      fabricRef.current = canvas;
      (window as any).fabricCanvas = canvas;

      // ClipPath — limita rendering all'area di stampa
      const clip = new fabric.Rect({
        ...coords,
        absolutePositioned: true,
      });
      canvas.clipPath = clip;

      // Bordo visivo area di stampa
      const printRect = new fabric.Rect({
        ...coords,
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 2,
        strokeDashArray: [8, 4],
        selectable: false,
        evented: false,
        name: 'printArea',
        opacity: 0.8,
      });
      canvas.add(printRect);
      canvas.sendToBack(printRect);

      // Stile maniglie touch-friendly
      fabric.Object.prototype.set({
        cornerSize: 22,
        cornerStyle: 'circle',
        borderColor: '#f97316',
        cornerColor: '#f97316',
        cornerStrokeColor: '#ffffff',
        transparentCorners: false,
        borderScaleFactor: 2,
        hasRotatingPoint: true,
        padding: 6,
      });

      // Vincola oggetti all'area di stampa
      const constrain = (obj: fabric.Object) => {
        if (!obj || (obj as any).name === 'printArea') return;
        const b = obj.getBoundingRect();
        let l = obj.left ?? 0;
        let t = obj.top  ?? 0;
        const vis = 0.3;
        const minW = b.width  * vis;
        const minH = b.height * vis;
        const { left: px, top: py, width: pw, height: ph } = coords;
        if (b.left < px - b.width  + minW) l = px - b.width  + minW + (l - b.left);
        if (b.top  < py - b.height + minH) t = py - b.height + minH + (t - b.top);
        if (b.left > px + pw - minW)       l = px + pw - minW + (l - b.left);
        if (b.top  > py + ph - minH)       t = py + ph - minH + (t - b.top);
        obj.set({ left: l, top: t });
        obj.setCoords();
      };

      canvas.on('object:moving',  e => constrain(e.target as fabric.Object));
      canvas.on('object:scaling', e => constrain(e.target as fabric.Object));
      canvas.on('object:rotating', e => constrain(e.target as fabric.Object));

      // Salvataggio automatico debounced
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

      // Carica design salvato per questo lato
      const saved = designStorage[storageKey];
      if (saved) {
        canvas.loadFromJSON(saved, () => {
          const pa = canvas.getObjects().find(o => (o as any).name === 'printArea');
          if (pa) canvas.sendToBack(pa);
          canvas.requestRenderAll();
        });
      }

      // Reset
      const handleReset = () => {
        canvas.clear();
        const newClip = new fabric.Rect({ ...coords, absolutePositioned: true });
        canvas.clipPath = newClip;
        const newRect = new fabric.Rect({
          ...coords, fill: 'transparent',
          stroke: '#10b981', strokeWidth: 2, strokeDashArray: [8, 4],
          selectable: false, evented: false, name: 'printArea', opacity: 0.8,
        });
        canvas.add(newRect);
        canvas.sendToBack(newRect);
        delete designStorage[storageKey];
        canvas.requestRenderAll();
      };
      window.addEventListener('resetCanvas', handleReset);

      // Applica subito lo zoom corretto
      const zoom = displaySize / LOGICAL;
      canvas.setZoom(zoom);
      canvas.setWidth(displaySize);
      canvas.setHeight(displaySize);
      canvas.requestRenderAll();

      return () => {
        clearTimeout(saveTimer);
        window.removeEventListener('resetCanvas', handleReset);
        save();
        canvas.dispose();
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [side, printArea, imgLoaded]);

  // ── 4. Aggiorna SOLO lo zoom quando cambia displaySize ────────────────────
  // NON reinizializza il canvas — scala solo la visualizzazione
  // Le coordinate logiche rimangono invariate su qualsiasi dispositivo
  useEffect(() => {
    if (!fabricRef.current || displaySize === 0) return;
    const zoom = displaySize / LOGICAL;
    fabricRef.current.setZoom(zoom);
    fabricRef.current.setWidth(displaySize);
    fabricRef.current.setHeight(displaySize);
    fabricRef.current.requestRenderAll();
  }, [displaySize]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative w-full aspect-square bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">

        {/* Mockup — sempre 100% del container */}
        <img
          ref={imgRef}
          src={mockupUrl}
          alt={`${productName} ${side}`}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          style={{ opacity: 0.95 }}
          draggable={false}
          onLoad={() => {
            setImgLoaded(false); // force re-init
            setTimeout(() => setImgLoaded(true), 50);
          }}
        />

        {/* Canvas Fabric — dimensione = displaySize, scalato via zoom */}
        <div className="absolute inset-0 flex items-center justify-center touch-none">
          <canvas ref={canvasRef} />
        </div>

        {/* Badge lato */}
        <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg pointer-events-none">
          {side === 'front' ? '👕 Fronte' : '🔄 Retro'}
        </div>

        {/* Dimensioni stampa */}
        {printArea && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 shadow pointer-events-none">
            File stampa: {printArea.widthCm} × {printArea.heightCm} cm
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-2">
        💡 Trascina per spostare • Pizzica per ridimensionare/ruotare • Rimani nell'area verde
      </p>
    </div>
  );
}
