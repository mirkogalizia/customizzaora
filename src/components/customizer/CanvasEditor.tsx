'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { PrintAreaDimensions } from '@/types';

interface CanvasEditorProps {
  mockupUrl: string;
  side: 'front' | 'back';
  productName: string;
  printArea?: PrintAreaDimensions;
}

const ORIGINAL_CANVAS_SIZE = 500;
const designStorage: Record<string, any> = {};

export function CanvasEditor({ mockupUrl, side, productName, printArea }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState(ORIGINAL_CANVAS_SIZE);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Storage key unico per ogni lato
  const storageKey = `design-${side}`;

  useEffect(() => {
    const calculateSize = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const isMobile = window.innerWidth < 768;
      const maxSize = isMobile ? containerWidth : Math.min(containerWidth, ORIGINAL_CANVAS_SIZE);
      
      setCanvasSize(maxSize);
    };

    calculateSize();
    
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(calculateSize, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  const getImageBounds = () => {
    if (!imgRef.current) return null;
    
    const img = imgRef.current;
    const imgNaturalRatio = img.naturalWidth / img.naturalHeight;
    
    let imgWidth: number, imgHeight: number, imgX: number, imgY: number;
    
    if (imgNaturalRatio > 1) {
      imgWidth = ORIGINAL_CANVAS_SIZE;
      imgHeight = ORIGINAL_CANVAS_SIZE / imgNaturalRatio;
      imgX = 0;
      imgY = (ORIGINAL_CANVAS_SIZE - imgHeight) / 2;
    } else {
      imgHeight = ORIGINAL_CANVAS_SIZE;
      imgWidth = ORIGINAL_CANVAS_SIZE * imgNaturalRatio;
      imgX = (ORIGINAL_CANVAS_SIZE - imgWidth) / 2;
      imgY = 0;
    }
    
    return { x: imgX, y: imgY, width: imgWidth, height: imgHeight };
  };

  // SALVA stato del lato corrente prima di cambiare
  const saveCurrentState = (canvas: fabric.Canvas) => {
    try {
      const objects = canvas.getObjects().filter(obj => (obj as any).name !== 'printArea');
      if (objects.length > 0) {
        const state = canvas.toJSON(['name']);
        designStorage[storageKey] = state;
        console.log(`💾 Salvato design per ${side}:`, objects.length, 'oggetti');
      } else {
        // Se non ci sono oggetti, rimuovi il salvataggio
        delete designStorage[storageKey];
        console.log(`🗑️ Rimosso salvataggio vuoto per ${side}`);
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  // CARICA stato del lato corrente
  const loadSavedState = (canvas: fabric.Canvas) => {
    const savedState = designStorage[storageKey];
    if (savedState) {
      try {
        console.log(`📂 Caricamento design per ${side}...`);
        canvas.loadFromJSON(savedState, () => {
          // Ripristina il print area rect dopo il caricamento
          const printAreaRect = canvas.getObjects().find(obj => (obj as any).name === 'printArea');
          if (printAreaRect) {
            canvas.sendToBack(printAreaRect);
          }
          canvas.requestRenderAll();
          console.log(`✅ Design ${side} caricato!`);
        });
      } catch (error) {
        console.error('Error loading state:', error);
      }
    } else {
      console.log(`📭 Nessun design salvato per ${side}`);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !imgLoaded || canvasSize === 0) return;

    // SALVA lo stato del lato precedente prima di reinizializzare
    if (fabricCanvasRef.current) {
      saveCurrentState(fabricCanvasRef.current);
    }

    const initCanvas = () => {
      const imgBounds = getImageBounds();
      if (!imgBounds) return;

      const xPercent = printArea?.xPercent || 35;
      const yPercent = printArea?.yPercent || 30;
      const widthPercent = printArea?.widthPercent || 30;
      const heightPercent = printArea?.heightPercent || 40;

      const printX = imgBounds.x + (imgBounds.width * xPercent / 100);
      const printY = imgBounds.y + (imgBounds.height * yPercent / 100);
      const printWidth = imgBounds.width * widthPercent / 100;
      const printHeight = imgBounds.height * heightPercent / 100;

      // CREA NUOVO CANVAS
      const canvas = new fabric.Canvas(canvasRef.current!, {
        width: ORIGINAL_CANVAS_SIZE,
        height: ORIGINAL_CANVAS_SIZE,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        selection: true,
        enableRetinaScaling: true,
      });

      fabricCanvasRef.current = canvas;

      const clipPath = new fabric.Rect({
        left: printX,
        top: printY,
        width: printWidth,
        height: printHeight,
        absolutePositioned: true,
      });
      canvas.clipPath = clipPath;

      const printAreaRect = new fabric.Rect({
        left: printX,
        top: printY,
        width: printWidth,
        height: printHeight,
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 2,
        strokeDashArray: [8, 4],
        selectable: false,
        evented: false,
        name: 'printArea',
        opacity: 0.8,
      });

      canvas.add(printAreaRect);
      canvas.sendToBack(printAreaRect);

      fabric.Object.prototype.set({
        cornerSize: 20,
        cornerStyle: 'circle',
        borderColor: '#f97316',
        cornerColor: '#f97316',
        cornerStrokeColor: '#fff',
        transparentCorners: false,
        borderScaleFactor: 2,
        hasRotatingPoint: true,
        padding: 5,
      });

      const constrainToArea = (obj: fabric.Object) => {
        if (!obj || (obj as any).name === 'printArea') return;

        const bound = obj.getBoundingRect();
        let left = obj.left || 0;
        let top = obj.top || 0;

        const minVisible = 0.3;
        const minVisibleWidth = bound.width * minVisible;
        const minVisibleHeight = bound.height * minVisible;

        const maxLeft = printX + printWidth - minVisibleWidth;
        const maxTop = printY + printHeight - minVisibleHeight;
        const minLeft = printX - bound.width + minVisibleWidth;
        const minTop = printY - bound.height + minVisibleHeight;

        if (bound.left < minLeft) left = minLeft + (obj.left! - bound.left);
        if (bound.top < minTop) top = minTop + (obj.top! - bound.top);
        if (bound.left > maxLeft) left = maxLeft + (obj.left! - bound.left);
        if (bound.top > maxTop) top = maxTop + (obj.top! - bound.top);

        obj.set({ left, top });
        obj.setCoords();
      };

      canvas.on('object:moving', (e) => constrainToArea(e.target as fabric.Object));
      canvas.on('object:scaling', (e) => constrainToArea(e.target as fabric.Object));
      canvas.on('object:rotating', (e) => constrainToArea(e.target as fabric.Object));

      // Auto-save quando l'utente modifica
      let saveTimeout: NodeJS.Timeout;
      const debouncedSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveCurrentState(canvas), 300);
      };

      canvas.on('object:modified', debouncedSave);
      canvas.on('object:added', debouncedSave);
      canvas.on('object:removed', debouncedSave);

      // CARICA lo stato salvato per questo lato
      loadSavedState(canvas);

      setIsReady(true);

      const handleReset = () => {
        canvas.clear();
        canvas.clipPath = clipPath;
        canvas.add(printAreaRect);
        canvas.sendToBack(printAreaRect);
        delete designStorage[storageKey];
        canvas.requestRenderAll();
        console.log(`🔄 Reset design ${side}`);
      };
      window.addEventListener('resetCanvas', handleReset);

      return () => {
        clearTimeout(saveTimeout);
        window.removeEventListener('resetCanvas', handleReset);
        saveCurrentState(canvas); // Salva prima di distruggere
        canvas.dispose();
      };
    };

    const timeoutId = setTimeout(initCanvas, 100);
    return () => clearTimeout(timeoutId);
  }, [side, printArea, imgLoaded, canvasSize]); // Nota: side è nelle dipendenze!

  useEffect(() => {
    if (fabricCanvasRef.current && isReady) {
      (window as any).fabricCanvas = fabricCanvasRef.current;
    }
  }, [isReady]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative w-full aspect-square bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
        <img
          ref={imgRef}
          src={mockupUrl}
          alt={`${productName} ${side}`}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          style={{ opacity: 0.9 }}
          draggable={false}
          onLoad={() => setImgLoaded(true)}
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative touch-none"
            style={{ width: canvasSize, height: canvasSize }}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow-lg pointer-events-none">
          {side === 'front' ? '👕 Fronte' : '🔙 Retro'}
        </div>

        {printArea && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs font-medium text-gray-700 shadow-md pointer-events-none">
            File stampa: {printArea.widthCm} × {printArea.heightCm} cm
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        💡 Trascina per spostare • Pizzica per ridimensionare/ruotare • Rimani nell area verde
      </p>
    </div>
  );
}
