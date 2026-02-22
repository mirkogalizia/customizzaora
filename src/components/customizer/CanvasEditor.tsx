'use client';

/**
 * CanvasEditor — Pulito e definitivo
 * Responsabilità: solo canvas. Nessuna toolbar, nessuna UI.
 * Espone window.fabricCanvas sempre aggiornato.
 * Design storage in memoria per front/back.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';

const LOGICAL = 500;
export const designStorage: Record<string, any> = {};

interface CanvasEditorProps {
  mockupUrl:     string;
  mockupUrlBack?: string;
  side:          'front' | 'back';
  onSideChange?: (s: 'front' | 'back') => void;
  productName:   string;
  printArea?:    PrintAreaDimensions;
  printAreaBack?: PrintAreaDimensions;
  onObjectSelected?: (obj: fabric.Object | null) => void;
}

function getCoords(img: HTMLImageElement | null, pa?: PrintAreaDimensions) {
  let iX = 0, iY = 0, iW = LOGICAL, iH = LOGICAL;
  if (img?.naturalWidth && img?.naturalHeight) {
    const r = img.naturalWidth / img.naturalHeight;
    if (r >= 1) { iW = LOGICAL; iH = LOGICAL / r; iY = (LOGICAL - iH) / 2; }
    else        { iH = LOGICAL; iW = LOGICAL * r;  iX = (LOGICAL - iW) / 2; }
  }
  return {
    left:   iX + iW * (pa?.xPercent      ?? 25) / 100,
    top:    iY + iH * (pa?.yPercent       ?? 20) / 100,
    width:  iW * (pa?.widthPercent        ?? 50) / 100,
    height: iH * (pa?.heightPercent       ?? 45) / 100,
  };
}

function FabricCanvas({ mockupUrl, side, visible, printArea, displaySize, isMobile, onReady, onSelect }: {
  mockupUrl: string; side: 'front' | 'back'; visible: boolean;
  printArea?: PrintAreaDimensions; displaySize: number; isMobile: boolean;
  onReady:  (s: 'front' | 'back', c: fabric.Canvas) => void;
  onSelect: (o: fabric.Object | null) => void;
}) {
  const cvRef  = useRef<HTMLCanvasElement>(null);
  const fbRef  = useRef<fabric.Canvas | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const key = `design-${side}`;

  useEffect(() => {
    if (!cvRef.current || !loaded || fbRef.current) return;
    const t = setTimeout(() => {
      if (!cvRef.current || !imgRef.current) return;
      const coords = getCoords(imgRef.current, printArea);
      const cv = new fabric.Canvas(cvRef.current, {
        width: LOGICAL, height: LOGICAL,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        allowTouchScrolling: false,
      });
      fbRef.current = cv;

      // Clip area stampa
      cv.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });

      // Rettangolo guida
      cv.add(new fabric.Rect({
        ...coords, fill: 'rgba(59,130,246,0.04)',
        stroke: '#3b82f6', strokeWidth: 1.5, strokeDashArray: [6, 4],
        selectable: false, evented: false, name: '__printArea',
      }));

      // Stile controlli
      if (isMobile) {
        fabric.Object.prototype.set({ hasControls: false, hasBorders: true, borderColor: '#f97316', borderScaleFactor: 2, padding: 14 });
      } else {
        fabric.Object.prototype.set({
          cornerSize: 14, cornerStyle: 'circle',
          borderColor: '#f97316', cornerColor: '#f97316',
          cornerStrokeColor: '#fff', transparentCorners: false,
          borderScaleFactor: 1.5, padding: 8,
        });
      }

      // Constraint dentro area stampa
      const constrain = (o: fabric.Object) => {
        if ((o as any).name === '__printArea') return;
        const b = o.getBoundingRect();
        const v = 0.25;
        let l = o.left ?? 0, t2 = o.top ?? 0;
        if (b.left < coords.left - b.width*v)               l = coords.left - b.width*v + (l - b.left);
        if (b.top  < coords.top  - b.height*v)              t2 = coords.top  - b.height*v + (t2 - b.top);
        if (b.left > coords.left + coords.width  - b.width*v)  l = coords.left + coords.width  - b.width*v + (l - b.left);
        if (b.top  > coords.top  + coords.height - b.height*v) t2 = coords.top  + coords.height - b.height*v + (t2 - b.top);
        o.set({ left: l, top: t2 }); o.setCoords();
      };
      cv.on('object:moving',   e => constrain(e.target!));
      cv.on('object:scaling',  e => constrain(e.target!));
      cv.on('object:rotating', e => constrain(e.target!));

      // Selezione → notifica toolbar
      cv.on('selection:created', e => onSelect((e as any).selected?.[0] ?? null));
      cv.on('selection:updated', e => onSelect((e as any).selected?.[0] ?? null));
      cv.on('selection:cleared', () => onSelect(null));

      // Autosave
      let st: ReturnType<typeof setTimeout>;
      const save = () => { clearTimeout(st); st = setTimeout(() => {
        const objs = cv.getObjects().filter(o => (o as any).name !== '__printArea');
        if (objs.length) designStorage[key] = cv.toJSON(['name']);
        else             delete designStorage[key];
      }, 300); };
      cv.on('object:modified', save);
      cv.on('object:added',    save);
      cv.on('object:removed',  save);

      // Ripristina design salvato
      if (designStorage[key]) {
        cv.loadFromJSON(designStorage[key], () => {
          cv.getObjects().forEach(o => { if ((o as any).name !== '__printArea' && isMobile) o.set({ hasControls: false }); });
          const pa = cv.getObjects().find(o => (o as any).name === '__printArea');
          if (pa) cv.sendToBack(pa);
          cv.requestRenderAll();
        });
      }

      // Reset globale
      const reset = () => {
        cv.clear();
        cv.clipPath = new fabric.Rect({ ...coords, absolutePositioned: true });
        cv.add(new fabric.Rect({ ...coords, fill: 'rgba(59,130,246,0.04)', stroke: '#3b82f6', strokeWidth: 1.5, strokeDashArray: [6, 4], selectable: false, evented: false, name: '__printArea' }));
        delete designStorage[key];
        cv.requestRenderAll();
      };
      window.addEventListener('resetCanvas', reset);
      window.addEventListener(`resetCanvas-${side}`, reset);

      // Zoom
      const z = displaySize / LOGICAL;
      cv.setZoom(z); cv.setWidth(displaySize); cv.setHeight(displaySize);
      cv.requestRenderAll();
      onReady(side, cv);
    }, 80);
    return () => clearTimeout(t);
  }, [loaded]);

  useEffect(() => {
    if (!fbRef.current) return;
    const z = displaySize / LOGICAL;
    fbRef.current.setZoom(z);
    fbRef.current.setWidth(displaySize);
    fbRef.current.setHeight(displaySize);
    fbRef.current.requestRenderAll();
  }, [displaySize]);

  return (
    <div style={{ display: visible ? 'block' : 'none', position: 'absolute', inset: 0 }}>
      <img ref={imgRef} src={mockupUrl} alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
        draggable={false}
        onLoad={() => { setLoaded(false); setTimeout(() => setLoaded(true), 40); }}
      />
      <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
        <canvas ref={cvRef} />
      </div>
    </div>
  );
}

export function CanvasEditor({
  mockupUrl, mockupUrlBack, side, onSideChange,
  productName, printArea, printAreaBack, onObjectSelected,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMap    = useRef<Record<string, fabric.Canvas>>({});
  const wrapperRef   = useRef<HTMLDivElement>(null);

  const [displaySize, setDisplaySize] = useState(() =>
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, LOGICAL) : LOGICAL
  );
  const isMobile = displaySize < 600;

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

  const handleReady = useCallback((s: 'front' | 'back', cv: fabric.Canvas) => {
    canvasMap.current[s] = cv;
    if (s === side) (window as any).fabricCanvas = cv;

    // Pinch-to-scale nativo sul wrapper (solo mobile)
    if (!isMobile || !wrapperRef.current) return;
    const wrapper = wrapperRef.current;
    let initDist = 0, initScale = 1, activeObj: fabric.Object | null = null;
    const dist = (a: Touch, b: Touch) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

    wrapper.addEventListener('touchstart', e => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      activeObj = cv.getActiveObject();
      if (!activeObj || (activeObj as any).name === '__printArea') return;
      initDist  = dist(e.touches[0], e.touches[1]);
      initScale = activeObj.scaleX ?? 1;
    }, { passive: false });

    wrapper.addEventListener('touchmove', e => {
      if (e.touches.length !== 2 || !activeObj) return;
      e.preventDefault();
      const s = Math.max(0.05, Math.min(10, initScale * dist(e.touches[0], e.touches[1]) / initDist));
      activeObj.set({ scaleX: s, scaleY: s });
      activeObj.setCoords();
      cv.requestRenderAll();
    }, { passive: false });

    wrapper.addEventListener('touchend', () => { activeObj = null; });
  }, [side, isMobile]);

  useEffect(() => {
    const cv = canvasMap.current[side];
    if (cv) (window as any).fabricCanvas = cv;
  }, [side]);

  const currentPrint = side === 'front' ? printArea : (printAreaBack ?? printArea);

  return (
    <div ref={containerRef} className="w-full">
      <div
        ref={wrapperRef}
        className="relative bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-gray-200"
        style={{ width: displaySize, height: displaySize }}
      >
        <FabricCanvas
          mockupUrl={mockupUrl}
          side="front" visible={side === 'front'}
          printArea={printArea} displaySize={displaySize}
          isMobile={isMobile}
          onReady={handleReady}
          onSelect={o => onObjectSelected?.(o)}
        />
        <FabricCanvas
          mockupUrl={mockupUrlBack ?? mockupUrl}
          side="back" visible={side === 'back'}
          printArea={printAreaBack ?? printArea} displaySize={displaySize}
          isMobile={isMobile}
          onReady={handleReady}
          onSelect={o => onObjectSelected?.(o)}
        />

        {/* Badge lato */}
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {side === 'front' ? '● FRONTE' : '● RETRO'}
          </span>
        </div>

        {/* Dimensioni */}
        {currentPrint && (
          <div className="absolute bottom-3 left-3 pointer-events-none">
            <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-600 px-2.5 py-1 rounded-lg shadow-sm">
              {currentPrint.widthCm} × {currentPrint.heightCm} cm
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
