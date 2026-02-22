'use client';

/**
 * /customize/[productId] — Pagina configuratore fullscreen
 * 
 * LAYOUT DESKTOP: canvas grande centro + toolbar destra fissa
 * LAYOUT MOBILE:  canvas alto + toolbar bottom sheet
 * 
 * Stile ispirato a t-shirtpersonalizzate.it / Zakeke:
 * canvas grande, controlli chiari, flusso semplice.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fabric } from 'fabric';
import { getShopifyProduct, findVariantId, ShopifyProduct } from '@/lib/shopify/storefront';
import { getProductMockups, ColorMockup, PrintAreas } from '@/lib/firebase/mockups';
import { CanvasEditor, designStorage } from '@/components/customizer/CanvasEditor';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, Type, Trash2, Copy, AlignCenter,
  RotateCcw, RotateCw, ShoppingCart, ChevronDown, ChevronUp,
  Minus, Plus, X, Check, Loader2, Bold, Italic,
} from 'lucide-react';

// ─── COSTANTI ────────────────────────────────────────────────────────────────

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FONTS = ['Arial', 'Georgia', 'Impact', 'Verdana', 'Courier New', 'Trebuchet MS'];
const TEXT_COLORS = ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];

const HANDLE_TO_SHOPIFY_ID: Record<string, string> = {
  'tshirt-personalizzata-spedizione-24h': '15409340350789',
  'felpa-personalizzata-spedizione-24h': '15598323237189',
  'girocollo-personalizzata-spedizione-24h': '15598448148805',
};

const FALLBACK_HEX: Record<string, string> = {
  'Black':'#111111','White':'#F5F5F5','Navy':'#1B2A4A','Indigo':'#4B0082',
  'Light Blue':'#ADD8E6','Mint':'#98FFD0','Forest Green':'#228B22','Purple':'#800080',
  'Red':'#CC0000','Grey':'#888888','Gray':'#888888','Yellow':'#FFD700',
  'Orange':'#FF6600','Pink':'#FFB6C1','Brown':'#8B4513','Beige':'#F5F5DC',
};

// ─── TOOLBAR PANEL ────────────────────────────────────────────────────────────

type Tab = 'image' | 'text' | 'edit';

function ToolPanel({ visible, onClose }: { visible: boolean; onClose?: () => void }) {
  const [tab, setTab]         = useState<Tab>('image');
  const [hasObj, setHasObj]   = useState(false);
  const [scale, setScale]     = useState(100);
  const [angle, setAngle]     = useState(0);
  const [text, setText]       = useState('Il tuo testo');
  const [font, setFont]       = useState('Arial');
  const [size, setSize]       = useState(48);
  const [color, setColor]     = useState('#000000');
  const [bold, setBold]       = useState(false);
  const [italic, setItalic]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cv = (): fabric.Canvas | null => (window as any).fabricCanvas ?? null;
  const active = (): fabric.Object | null => {
    const o = cv()?.getActiveObject();
    return (o && (o as any).name !== '__guide') ? o : null;
  };

  // Sincronizza con selezione canvas
  useEffect(() => {
    const check = setInterval(() => {
      const canvas = cv();
      if (!canvas) return;
      clearInterval(check);
      const sync = () => {
        const o = active();
        setHasObj(!!o);
        if (o) {
          setScale(Math.round((o.scaleX ?? 1) * 100));
          setAngle(Math.round(o.angle ?? 0));
          if (tab !== 'edit') setTab('edit');
        }
      };
      canvas.on('selection:created', sync);
      canvas.on('selection:updated', sync);
      canvas.on('selection:cleared', () => { setHasObj(false); });
    }, 300);
    return () => clearInterval(check);
  }, []);

  const applyScale = (v: number) => {
    const o = active(); const c = cv(); if (!o || !c) return;
    const s = v / 100;
    o.set({ scaleX: s, scaleY: s }); o.setCoords(); c.requestRenderAll();
    setScale(v);
  };

  const applyAngle = (v: number) => {
    const o = active(); const c = cv(); if (!o || !c) return;
    o.set({ angle: v }); o.setCoords(); c.requestRenderAll();
    setAngle(v);
  };

  const center = () => {
    const o = active(); const c = cv(); if (!o || !c) return;
    const pa = c.getObjects().find((x: any) => x.name === '__guide') as any;
    if (pa) o.set({ left: pa.left + pa.width / 2, top: pa.top + pa.height / 2 });
    else c.centerObject(o);
    o.setCoords(); c.requestRenderAll();
  };

  const duplicate = () => {
    const o = active(); const c = cv(); if (!o || !c) return;
    o.clone((cl: fabric.Object) => {
      cl.set({ left: (o.left ?? 0) + 20, top: (o.top ?? 0) + 20 });
      c.add(cl); c.setActiveObject(cl); c.requestRenderAll();
    });
  };

  const remove = () => {
    const o = active(); const c = cv(); if (!o || !c) return;
    c.remove(o); c.requestRenderAll(); setHasObj(false);
  };

  const getPrintCenter = () => {
    const c = cv(); if (!c) return { x: 250, y: 250, w: 200, h: 200 };
    const pa = c.getObjects().find((o: any) => o.name === '__guide') as any;
    return pa ? { x: pa.left + pa.width / 2, y: pa.top + pa.height / 2, w: pa.width, h: pa.height }
              : { x: 250, y: 250, w: 200, h: 200 };
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const c = cv(); if (!c) return;
    const { x, y, w, h } = getPrintCenter();
    const reader = new FileReader();
    reader.onload = ev => {
      fabric.Image.fromURL(ev.target?.result as string, img => {
        const scale = Math.min((w * 0.8) / (img.width ?? 1), (h * 0.8) / (img.height ?? 1));
        img.set({ left: x, top: y, scaleX: scale, scaleY: scale, originX: 'center', originY: 'center' });
        c.add(img); c.setActiveObject(img); c.requestRenderAll();
        toast.success('Immagine aggiunta!');
        onClose?.();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addText = () => {
    const c = cv(); if (!c) return;
    const { x, y } = getPrintCenter();
    c.add(new fabric.IText(text || 'Testo', {
      left: x, top: y, fontFamily: font, fontSize: size, fill: color,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      originX: 'center', originY: 'center', editable: true,
    }));
    c.requestRenderAll();
    toast.success('Testo aggiunto!');
    onClose?.();
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'image', label: '📷 Immagine' },
    { id: 'text',  label: '✍️ Testo'    },
    { id: 'edit',  label: hasObj ? '⚙️ Modifica' : '⚙️ Modifica' },
  ];

  return (
    <div className={`flex flex-col h-full ${visible ? '' : 'hidden'}`}>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">

        {/* ── TAB IMMAGINE ── */}
        {tab === 'image' && (
          <div className="space-y-4">
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 rounded-2xl p-8 flex flex-col items-center gap-3 transition-all group cursor-pointer">
              <div className="w-14 h-14 bg-orange-100 group-hover:bg-orange-200 rounded-full flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">Carica la tua immagine</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, SVG • max 10MB</p>
              </div>
              <div className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                💡 PNG con sfondo trasparente = risultato migliore
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
        )}

        {/* ── TAB TESTO ── */}
        {tab === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Testo</label>
              <input value={text} onChange={e => setText(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                placeholder="Scrivi qui..." />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Font</label>
              <select value={font} onChange={e => setFont(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-sm outline-none bg-white">
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                Dimensione — {size}px
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setSize(s => Math.max(8, s - 4))}
                  className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-gray-400 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <input type="range" min={8} max={120} value={size} onChange={e => setSize(Number(e.target.value))}
                  className="flex-1 h-2 accent-orange-500 cursor-pointer" />
                <button onClick={() => setSize(s => Math.min(120, s + 4))}
                  className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-gray-400 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setBold(b => !b)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${bold ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                <Bold className="w-4 h-4" /> Grassetto
              </button>
              <button onClick={() => setItalic(i => !i)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${italic ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                <Italic className="w-4 h-4" /> Corsivo
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Colore</label>
              <div className="flex flex-wrap gap-2">
                {TEXT_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110 shadow-md' : 'border-white shadow-sm hover:scale-105'}`} />
                ))}
                <div className="relative">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)}
                    className="w-9 h-9 rounded-full cursor-pointer border-2 border-gray-200 overflow-hidden opacity-0 absolute inset-0" />
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 pointer-events-none">+</div>
                </div>
              </div>
            </div>

            <button onClick={addText}
              className="w-full bg-gray-900 hover:bg-gray-700 text-white rounded-2xl py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <Type className="w-4 h-4" /> Aggiungi al design
            </button>
          </div>
        )}

        {/* ── TAB MODIFICA ── */}
        {tab === 'edit' && (
          hasObj ? (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dimensione</label>
                  <span className="text-sm font-bold text-gray-900">{scale}%</span>
                </div>
                <input type="range" min={5} max={250} value={scale} onChange={e => applyScale(Number(e.target.value))}
                  className="w-full h-2 accent-orange-500 cursor-pointer" />
                <div className="flex justify-between mt-2">
                  <button onClick={() => applyScale(Math.max(5, scale - 10))} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><Minus className="w-3 h-3" />-10%</button>
                  <button onClick={() => applyScale(100)} className="text-xs text-gray-400 hover:text-gray-600">Reset</button>
                  <button onClick={() => applyScale(Math.min(250, scale + 10))} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">+10%<Plus className="w-3 h-3" /></button>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rotazione</label>
                  <span className="text-sm font-bold text-gray-900">{angle}°</span>
                </div>
                <input type="range" min={0} max={360} value={angle} onChange={e => applyAngle(Number(e.target.value))}
                  className="w-full h-2 accent-orange-500 cursor-pointer" />
                <div className="flex justify-between mt-2">
                  <button onClick={() => applyAngle((angle - 15 + 360) % 360)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><RotateCcw className="w-3 h-3" />-15°</button>
                  <button onClick={() => applyAngle(0)} className="text-xs text-gray-400 hover:text-gray-600">Reset</button>
                  <button onClick={() => applyAngle((angle + 15) % 360)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">+15°<RotateCw className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button onClick={center} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-xs font-semibold text-gray-700">
                  <AlignCenter className="w-4 h-4" />Centra
                </button>
                <button onClick={duplicate} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-xs font-semibold text-gray-700">
                  <Copy className="w-4 h-4" />Duplica
                </button>
                <button onClick={remove} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all text-xs font-semibold text-red-500">
                  <Trash2 className="w-4 h-4" />Elimina
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AlignCenter className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Nessun elemento selezionato</p>
              <p className="text-xs text-gray-400 mt-1">Tocca un elemento sul canvas per modificarlo</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── PAGINA PRINCIPALE ────────────────────────────────────────────────────────

export default function CustomizePage() {
  const params  = useParams();
  const router  = useRouter();
  const handle  = params.productId as string;
  const { addItem, loading: cartLoading } = useCart();

  const [product, setProduct]         = useState<ShopifyProduct | null>(null);
  const [mockups, setMockups]         = useState<Record<string, ColorMockup>>({});
  const [printAreas, setPrintAreas]   = useState<PrintAreas | null>(null);
  const [loading, setLoading]         = useState(true);
  const [selectedColor, setColor]     = useState<string | null>(null);
  const [selectedSize, setSize]       = useState('M');
  const [side, setSide]               = useState<'front' | 'back'>('front');
  const [qty, setQty]                 = useState(1);
  const [sheetOpen, setSheetOpen]     = useState(false);
  const [objSelected, setObjSel]      = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { loadProduct(); }, [handle]);

  const loadProduct = async () => {
    try {
      const sp = await getShopifyProduct(handle);
      if (!sp) { toast.error('Prodotto non trovato'); router.push('/products'); return; }
      setProduct(sp);
      const colors = getColors(sp);
      if (colors.length) setColor(colors[0]);
      const shopifyId = HANDLE_TO_SHOPIFY_ID[handle];
      if (shopifyId) {
        const saved = await getProductMockups(shopifyId);
        if (saved?.colors)     setMockups(saved.colors);
        if (saved?.printAreas) setPrintAreas(saved.printAreas);
      }
    } catch { toast.error('Errore caricamento'); }
    finally  { setLoading(false); }
  };

  const getColors = (sp: ShopifyProduct) => {
    const seen = new Set<string>(); const result: string[] = [];
    sp.variants.edges.forEach(({ node }) => {
      const c = node.selectedOptions.find(o => o.name === 'Colore');
      if (c && !seen.has(c.value)) { seen.add(c.value); result.push(c.value); }
    });
    return result;
  };

  const getSizes = (sp: ShopifyProduct, color: string) =>
    sp.variants.edges
      .filter(({ node }) => node.selectedOptions.find(o => o.name === 'Colore')?.value === color && node.availableForSale)
      .map(({ node }) => node.selectedOptions.find(o => o.name === 'Taglia')?.value ?? '')
      .filter(Boolean);

  const getHex = (name: string) => {
    const fromMockup = mockups[name]?.colorHex;
    if (fromMockup && fromMockup !== '#000000') return fromMockup;
    const k = Object.keys(FALLBACK_HEX).find(k => k.toLowerCase() === name.toLowerCase());
    return k ? FALLBACK_HEX[k] : '#CCCCCC';
  };

  const colors   = product ? getColors(product) : [];
  const sizes    = product && selectedColor ? getSizes(product, selectedColor) : [];
  const mockup   = selectedColor ? mockups[selectedColor] : null;
  const mockupFront = mockup?.mockupFront ?? null;
  const mockupBack  = mockup?.mockupBack  ?? null;
  const price    = product ? parseFloat(product.priceRange.minVariantPrice.amount) : 0;

  const handleAddToCart = async () => {
    if (!selectedColor || !product) return;
    try {
      const fc = (window as any).fabricCanvas;
      const previewUrl = fc?.toDataURL ? fc.toDataURL({ format: 'png', quality: 0.7 }) : null;
      const variantId  = findVariantId(product, selectedColor, selectedSize);
      if (!variantId) { toast.error(`${selectedColor} / ${selectedSize} non disponibile`); return; }
      await addItem(variantId, qty, [
        { key: 'colore',     value: selectedColor },
        { key: 'colore_hex', value: getHex(selectedColor) },
        { key: 'taglia',     value: selectedSize },
        { key: 'handle',     value: handle },
        ...(previewUrl ? [{ key: 'preview_url', value: previewUrl }] : []),
      ]);
      toast.success('✅ Aggiunto al carrello!');
      router.push(`/products/${handle}`);
    } catch (err: any) {
      toast.error(err.message || 'Errore');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── TOPBAR ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.push(`/products/${handle}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Torna al prodotto</span>
          </button>

          <div className="text-center">
            <p className="font-bold text-gray-900 text-sm leading-tight">{product?.title}</p>
            {selectedColor && <p className="text-xs text-gray-500">{selectedColor}</p>}
          </div>

          <button onClick={handleAddToCart} disabled={!selectedColor || cartLoading || sizes.length === 0}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
            {cartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            <span className="hidden sm:inline">Aggiungi — </span>€{(price * qty).toFixed(2)}
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── DESKTOP: pannello sinistro configurazione ── */}
        <div className={`hidden lg:flex flex-col w-72 xl:w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto`}>
          <div className="p-5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Variante</p>

            {/* Colore */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Colore</span>
                <span className="text-xs text-gray-500">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => {
                  const hex = getHex(c);
                  const isLight = ['#F5F5F5','#F5F5DC','#FFD700','#ADD8E6','#98FFD0','#FFB6C1'].includes(hex);
                  return (
                    <button key={c} onClick={() => { setColor(c); setSide('front'); }}
                      title={c}
                      className={`relative w-9 h-9 rounded-full border-2 transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'border-white shadow-sm hover:scale-105'}`}
                      style={{ backgroundColor: hex }}>
                      {selectedColor === c && <Check className={`w-4 h-4 absolute inset-0 m-auto drop-shadow ${isLight ? 'text-gray-800' : 'text-white'}`} />}
                      {mockups[c] && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Taglia */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-700 block mb-2">Taglia</span>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map(s => {
                  const ok = sizes.includes(s);
                  return (
                    <button key={s} onClick={() => ok && setSize(s)} disabled={!ok}
                      className={`w-10 h-10 text-sm font-bold rounded-xl border-2 transition-all ${selectedSize === s ? 'border-gray-900 bg-gray-900 text-white' : ok ? 'border-gray-200 hover:border-gray-400' : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantità */}
            <div>
              <span className="text-sm font-semibold text-gray-700 block mb-2">Quantità</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-gray-400 transition-colors font-bold">−</button>
                <span className="text-lg font-bold w-8 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(99, q + 1))}
                  className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-gray-400 transition-colors font-bold">+</button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5">
            <ToolPanel visible={true} />
          </div>

          {/* Reset design */}
          <div className="p-5 border-t border-gray-100">
            <button onClick={() => { if (confirm('Cancellare il design?')) { window.dispatchEvent(new CustomEvent('resetCanvas')); toast.success('Design cancellato'); }}}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors">
              <RotateCcw className="w-4 h-4" />Cancella design
            </button>
          </div>
        </div>

        {/* ── CANVAS AREA ── */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto bg-gray-50 p-4 lg:p-8">

          {/* Switch fronte/retro */}
          <div className="flex gap-2 mb-4 w-full max-w-lg">
            {(['front', 'back'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${side === s ? 'bg-gray-900 text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {s === 'front' ? '👕 Fronte' : '🔄 Retro'}
              </button>
            ))}
            <button onClick={() => { if (confirm('Cancellare?')) { window.dispatchEvent(new CustomEvent('resetCanvas')); }}}
              className="px-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-500 hover:border-red-300 hover:text-red-500 transition-all lg:hidden">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas */}
          <div className="w-full max-w-lg">
            {mockupFront ? (
              <CanvasEditor
                mockupUrl={mockupFront}
                mockupUrlBack={mockupBack ?? undefined}
                side={side}
                productName={product?.title ?? ''}
                printArea={printAreas?.front ?? undefined}
                printAreaBack={printAreas?.back ?? undefined}
                onObjectSelected={setObjSel}
              />
            ) : (
              <div className="aspect-square bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3">
                {selectedColor ? (
                  <>
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: getHex(selectedColor) }} />
                    <p className="font-semibold text-gray-700">{selectedColor}</p>
                    <p className="text-sm text-gray-400 text-center px-8">Mockup non configurato per questo colore</p>
                  </>
                ) : (
                  <p className="text-gray-400">Seleziona un colore</p>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center mt-3">
            💡 Trascina per spostare · Pinch (2 dita) per ridimensionare · Rimani nell'area verde
          </p>

          {/* ── MOBILE: selezione colore/taglia sotto il canvas ── */}
          <div className="lg:hidden w-full max-w-lg mt-6 bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            {/* Colore */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Colore</span>
                <span className="text-xs text-gray-500">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => {
                  const hex = getHex(c);
                  const isLight = ['#F5F5F5','#F5F5DC','#FFD700','#ADD8E6','#98FFD0','#FFB6C1'].includes(hex);
                  return (
                    <button key={c} onClick={() => { setColor(c); setSide('front'); }}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: hex }}>
                      {selectedColor === c && <Check className={`w-4 h-4 absolute inset-0 m-auto drop-shadow ${isLight ? 'text-gray-800' : 'text-white'}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Taglia */}
            <div>
              <span className="text-sm font-bold text-gray-700 block mb-2">Taglia</span>
              <div className="flex gap-2">
                {SIZES.map(s => {
                  const ok = sizes.includes(s);
                  return (
                    <button key={s} onClick={() => ok && setSize(s)} disabled={!ok}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl border-2 transition-all ${selectedSize === s ? 'border-gray-900 bg-gray-900 text-white' : ok ? 'border-gray-200' : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantità */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">Quantità</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center font-bold">−</button>
                <span className="text-lg font-bold w-8 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(99, q + 1))}
                  className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center font-bold">+</button>
              </div>
            </div>

            {/* CTA mobile */}
            <button onClick={handleAddToCart} disabled={!selectedColor || cartLoading || sizes.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2">
              {cartLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
              Aggiungi al carrello — €{(price * qty).toFixed(2)}
            </button>
          </div>

          {/* Spacer per bottom bar mobile */}
          <div className="h-28 lg:hidden" />
        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 safe-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

        {/* Bottom sheet toolbar */}
        <div className={`transition-all duration-300 ease-out overflow-hidden ${sheetOpen ? 'max-h-[65vh]' : 'max-h-0'}`}>
          <div className="bg-white border-t border-gray-200 px-5 pt-4 pb-2">
            {/* Handle + chiudi */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-900">Personalizza design</span>
              <button onClick={() => setSheetOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(65vh - 80px)' }}>
              <ToolPanel visible={true} onClose={() => setSheetOpen(false)} />
            </div>
          </div>
        </div>

        {/* Barra fissa con bottoni */}
        <div className="flex gap-2 p-3">
          <button onClick={() => setSheetOpen(s => !s)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${sheetOpen ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {sheetOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            {objSelected && !sheetOpen ? 'Modifica selezionato' : 'Personalizza'}
          </button>
          <button onClick={handleAddToCart} disabled={!selectedColor || cartLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm transition-colors">
            {cartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            €{(price * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}