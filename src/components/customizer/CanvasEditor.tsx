'use client';

/**
 * CanvasEditor v3 — Solo canvas, nessuna UI.
 * Gestisce: init, resize, design storage, constraints, pinch mobile.
 * Espone window.fabricCanvas sempre aggiornato.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';

const LOGICAL = 500;

// Design in memoria per fronte/retro — sopravvive ai re-render
const designStorage: Record<string, any> = {};

export { designStorage };

interface CanvasEditorProps {
  mockupUrl:      string;
  mockupUrlBack?: string;
  side:           'front' | 'back';
  productName:    string;
  printArea?:     PrintAreaDimensions;
  printAreaBack?: PrintAreaDimensions;
  onObjectSelected?: (selected: boolean) => void;
}

function calcPrintCoords(img: HTMLImageElement, pa?: PrintAreaDimensions) {
  const r = img.naturalWidth / img.naturalHeight;
  let iW = LOGICAL, iH = LOGICAL, iX = 0, iY = 0;
  if (r >= 1) { iW = LOGICAL; iH = LOGICAL / r; iY = (LOGICAL - iH) / 2; }
  else        { iH = LOGICAL; iW = LOGICAL * r;  iX = (LOGICAL - iW) / 2; }
  return {
    left:   iX + iW * (pa?.xPercent     ?? 25) / 100,
    top:    iY + iH * (pa?.yPercent      ?? 20) / 100,
    width:  iW * (pa?.widthPercent       ?? 50) / 100,
    height: iH * (pa?.heightPercent      ?? 45) / 100,
  };
}

export function CanvasEditor({
  mockupUrl, mockupUrlBack, side, productName,
  printArea, printAreaBack, onObjectSelected,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const imgFrontRef  = useRef<HTMLImageElement>(null);
  const imgBackRef   = useRef<HTMLImageElement>(null);
  const cvFrontRef   = useRef<HTMLCanvasElement>(null);
  const cvBackRef    = useRef<HTMLCanvasElement>(null);
  const fbFront      = useRef<fabric.Canvas | null>(null);
  const fbBack       = useRef<fabric.Canvas | null>(null);
  const [size, setSize]          = useState(LOGICAL);
  const [frontLoaded, setFront]  = useState(false);
  const [backLoaded,  setBack]   = useState(false);

  // Resize observer
  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.offsetWidth;
    setSize(Math.min(w, LOGICAL));
  }, []);

  useEffect(() => {
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateSize]);

  // Aggiorna zoom quando size cambia
  useEffect(() => {
    const z = size / LOGICAL;
    [fbFront.current, fbBack.current].forEach(cv => {
      if (!cv) return;
      cv.setZoom(z); cv.setWidth(size); cv.setHeight(size);
      cv.requestRenderAll();
    });
  }, [size]);

  // Init canvas per un lato
  const initCanvas = useCallback((
    cvEl: HTMLCanvasElement,
    imgEl: HTMLImageElement,
    sideKey: 'front' | 'back',
    fbRef: React.MutableRefObject<fabric.Canvas | null>,
    pa?: PrintAreaDimensions,
  ) => {
    if (fbRef.current) return; // già inizializzato

    const coords = calcPrintCoords(imgEl, pa);
    const cv = new fabric.Canvas(cvEl, {
      width: LOGICAL, height: LOGICAL,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      allowTouchScrolling: false,
    });
    fbRef.current = cv;

    // Clip + rettangolo guida
    cv.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
    const guide = new fabric.Rect({
      ...coords, fill: 'rgba(16,185,129,0.05)',
      stroke: '#10b981', strokeWidth: 2, strokeDashArray: [8, 4],
      selectable: false, evented: false, name: '__guide',
    });
    cv.add(guide); cv.sendToBack(guide);

    // Stile handles
    fabric.Object.prototype.set({
      cornerSize: 18, cornerStyle: 'circle',
      borderColor: '#f97316', cornerColor: '#f97316',
      cornerStrokeColor: '#ffffff', transparentCorners: false,
      borderScaleFactor: 2, padding: 10,
    });

    // Constraints
    const constrain = (obj: fabric.Object) => {
      if ((obj as any).name === '__guide') return;
      const b = obj.getBoundingRect();
      const v = 0.25;
      let l = obj.left ?? 0, t = obj.top ?? 0;
      if (b.left < coords.left - b.width * v)               l = coords.left - b.width * v + (l - b.left);
      if (b.top  < coords.top  - b.height * v)              t = coords.top  - b.height * v + (t - b.top);
      if (b.left > coords.left + coords.width  - b.width * v)  l = coords.left + coords.width  - b.width * v + (l - b.left);
      if (b.top  > coords.top  + coords.height - b.height * v) t = coords.top  + coords.height - b.height * v + (t - b.top);
      obj.set({ left: l, top: t }); obj.setCoords();
    };
    cv.on('object:moving',   e => constrain(e.target!));
    cv.on('object:scaling',  e => constrain(e.target!));
    cv.on('object:rotating', e => constrain(e.target!));

    // Notifica selezione
    cv.on('selection:created', e => {
      const o = (e as any).selected?.[0];
      if (o && (o as any).name !== '__guide') onObjectSelected?.(true);
    });
    cv.on('selection:updated', e => {
      const o = (e as any).selected?.[0];
      if (o && (o as any).name !== '__guide') onObjectSelected?.(true);
    });
    cv.on('selection:cleared', () => onObjectSelected?.(false));

    // Autosave
    let st: ReturnType<typeof setTimeout>;
    const save = () => { clearTimeout(st); st = setTimeout(() => {
      const objs = cv.getObjects().filter(o => (o as any).name !== '__guide');
      if (objs.length) designStorage[`design-${sideKey}`] = cv.toJSON(['name']);
      else             delete designStorage[`design-${sideKey}`];
    }, 300); };
    cv.on('object:modified', save);
    cv.on('object:added',    save);
    cv.on('object:removed',  save);

    // Ripristina design
    const saved = designStorage[`design-${sideKey}`];
    if (saved) {
      cv.loadFromJSON(saved, () => {
        cv.getObjects().find(o => (o as any).name === '__guide') && cv.sendToBack(cv.getObjects().find(o => (o as any).name === '__guide')!);
        cv.requestRenderAll();
      });
    }

    // Reset
    const onReset = () => {
      cv.clear();
      cv.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
      const g = new fabric.Rect({ ...coords, fill: 'rgba(16,185,129,0.05)', stroke: '#10b981', strokeWidth: 2, strokeDashArray: [8, 4], selectable: false, evented: false, name: '__guide' });
      cv.add(g); cv.sendToBack(g);
      delete designStorage[`design-${sideKey}`];
      cv.requestRenderAll();
    };
    window.addEventListener('resetCanvas', onReset);
    window.addEventListener(`resetCanvas-${sideKey}`, onReset);

    // Applica zoom corrente
    const z = size / LOGICAL;
    cv.setZoom(z); cv.setWidth(size); cv.setHeight(size);
    cv.requestRenderAll();
  }, [size, onObjectSelected]);

  // Init fronte
  useEffect(() => {
    if (!frontLoaded || !cvFrontRef.current || !imgFrontRef.current) return;
    const t = setTimeout(() => initCanvas(cvFrontRef.current!, imgFrontRef.current!, 'front', fbFront, printArea), 80);
    return () => clearTimeout(t);
  }, [frontLoaded]);

  // Init retro
  useEffect(() => {
    if (!backLoaded || !cvBackRef.current || !imgBackRef.current) return;
    const t = setTimeout(() => initCanvas(cvBackRef.current!, imgBackRef.current!, 'back', fbBack, printAreaBack ?? printArea), 80);
    return () => clearTimeout(t);
  }, [backLoaded]);

  // Aggiorna window.fabricCanvas quando cambia side
  useEffect(() => {
    const cv = side === 'front' ? fbFront.current : fbBack.current;
    if (cv) (window as any).fabricCanvas = cv;
  }, [side, frontLoaded, backLoaded]);

  // Pinch-to-scale nativo sul wrapper
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let initDist = 0, initScale = 1, activeObj: fabric.Object | null = null;
    const dist = (a: Touch, b: Touch) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const cv = (window as any).fabricCanvas as fabric.Canvas;
      if (!cv) return;
      activeObj = cv.getActiveObject();
      if (!activeObj || (activeObj as any).name === '__guide') { activeObj = null; return; }
      e.preventDefault();
      initDist  = dist(e.touches[0], e.touches[1]);
      initScale = activeObj.scaleX ?? 1;
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !activeObj) return;
      e.preventDefault();
      const cv = (window as any).fabricCanvas as fabric.Canvas;
      const s  = Math.max(0.05, Math.min(10, initScale * dist(e.touches[0], e.touches[1]) / initDist));
      activeObj.set({ scaleX: s, scaleY: s }); activeObj.setCoords();
      cv?.requestRenderAll();
    };
    const onEnd = () => { activeObj = null; };

    wrapper.addEventListener('touchstart', onStart, { passive: false });
    wrapper.addEventListener('touchmove',  onMove,  { passive: false });
    wrapper.addEventListener('touchend',   onEnd);
    return () => {
      wrapper.removeEventListener('touchstart', onStart);
      wrapper.removeEventListener('touchmove',  onMove);
      wrapper.removeEventListener('touchend',   onEnd);
    };
  }, []);

  const currentPrint = side === 'front' ? printArea : (printAreaBack ?? printArea);
  const backUrl = mockupUrlBack ?? mockupUrl;

  return (
    <div ref={containerRef} className="w-full">
      <div
        ref={wrapperRef}
        className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-200"
        style={{ width: size, height: size }}
      >
        {/* FRONTE */}
        <div style={{ display: side === 'front' ? 'block' : 'none', position: 'absolute', inset: 0 }}>
          <img ref={imgFrontRef} src={mockupUrl} alt={productName}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
            draggable={false} onLoad={() => { setFront(false); setTimeout(() => setFront(true), 30); }}
          />
          <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
            <canvas ref={cvFrontRef} />
          </div>
        </div>

        {/* RETRO */}
        <div style={{ display: side === 'back' ? 'block' : 'none', position: 'absolute', inset: 0 }}>
          <img ref={imgBackRef} src={backUrl} alt={productName}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
            draggable={false} onLoad={() => { setBack(false); setTimeout(() => setBack(true), 30); }}
          />
          <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
            <canvas ref={cvBackRef} />
          </div>
        </div>

        {/* Badge lato */}
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {side === 'front' ? '● FRONTE' : '● RETRO'}
          </span>
        </div>

        {/* Dimensioni stampa */}
        {currentPrint && (
          <div className="absolute bottom-3 left-3 pointer-events-none">
            <span className="bg-white/90 text-xs font-medium text-gray-600 px-2.5 py-1 rounded-lg shadow-sm">
              Area stampa: {currentPrint.widthCm} × {currentPrint.heightCm} cm
            </span>
          </div>
        )}
      </div>
    </div>
  );
}