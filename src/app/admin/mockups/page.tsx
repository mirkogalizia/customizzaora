'use client'

import { useEffect, useState, useRef } from 'react'
import { getShopifyProducts, ShopifyProduct } from '@/lib/shopify/storefront'
import {
  getProductMockups, saveColorMockup, uploadMockupImage,
  ColorMockup, PrintArea
} from '@/lib/firebase/mockups'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

const HANDLE_TO_SHOPIFY_ID: Record<string, string> = {
  'tshirt-personalizzata-spedizione-24h': '15409340350789',
  'felpa-personalizzata-spedizione-24h': '15598323237189',
  'girocollo-personalizzata-spedizione-24h': '15598448148805',
}

const FALLBACK_HEX: Record<string, string> = {
  'Black': '#111111', 'White': '#F5F5F5', 'Navy': '#1B2A4A',
  'Indigo': '#4B0082', 'Light Blue': '#ADD8E6', 'Mint': '#98FFD0',
  'Forest Green': '#228B22', 'Purple': '#800080',
}

const DEFAULT_PRINT_AREA: PrintArea = {
  xPercent: 25, yPercent: 20,
  widthPercent: 50, heightPercent: 45,
  widthCm: 30, heightCm: 40,
}

// Estrae colori unici usando "Colore" (italiano)
function getUniqueColors(product: ShopifyProduct): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const { node } of product.variants.edges) {
    const colorOpt = node.selectedOptions.find(o => o.name === 'Colore')
    if (colorOpt && !seen.has(colorOpt.value)) {
      seen.add(colorOpt.value)
      result.push(colorOpt.value)
    }
  }
  return result
}

// ─── RIGA SINGOLO COLORE ─────────────────────────────────────────────────────

interface ColorRowProps {
  productId: string
  handle: string
  colorName: string
  savedMockup?: ColorMockup
  onSaved: () => void
}

function ColorRow({ productId, handle, colorName, savedMockup, onSaved }: ColorRowProps) {
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string>(savedMockup?.mockupFront ?? '')
  const [backPreview, setBackPreview] = useState<string>(savedMockup?.mockupBack ?? '')
  const [printArea, setPrintArea] = useState<PrintArea>(savedMockup?.printArea ?? DEFAULT_PRINT_AREA)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(!savedMockup?.mockupFront)
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  const isSaved = !!savedMockup?.mockupFront
  const hex = FALLBACK_HEX[colorName] ?? '#CCCCCC'
  const isLight = ['White', 'Light Blue', 'Mint'].includes(colorName)

  const handleFile = (side: 'front' | 'back', file: File) => {
    const url = URL.createObjectURL(file)
    if (side === 'front') { setFrontFile(file); setFrontPreview(url) }
    else { setBackFile(file); setBackPreview(url) }
  }

  const handleSave = async () => {
    if (!frontPreview && !backPreview) { toast.error("Carica almeno un'immagine"); return }
    setSaving(true)
    try {
      let finalFront = savedMockup?.mockupFront ?? ''
      let finalBack = savedMockup?.mockupBack ?? ''
      if (frontFile) finalFront = await uploadMockupImage(productId, colorName, 'front', frontFile)
      if (backFile) finalBack = await uploadMockupImage(productId, colorName, 'back', backFile)

      await saveColorMockup(productId, handle, colorName, {
        colorName,
        colorHex: hex,
        mockupFront: finalFront,
        mockupBack: finalBack,
        printArea,
      })
      toast.success(`✅ ${colorName} salvato!`)
      onSaved()
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message ?? 'Errore salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
            style={{ backgroundColor: hex }}
          />
          <span className="font-medium text-gray-900">{colorName}</span>
          {isSaved
            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" />Configurato</span>
            : <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Mancante</span>
          }
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="p-5 border-t bg-gray-50 space-y-5">

          {/* Upload fronte / retro */}
          <div className="grid grid-cols-2 gap-4">
            {(['front', 'back'] as const).map(side => {
              const preview = side === 'front' ? frontPreview : backPreview
              const inputRef = side === 'front' ? frontRef : backRef
              return (
                <div key={side}>
                  <Label className="mb-2 block font-medium">
                    {side === 'front' ? '👕 Fronte' : '🔄 Retro'}
                  </Label>
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all overflow-hidden bg-white relative"
                  >
                    {preview ? (
                      <>
                        <img src={preview} alt={side} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Cambia immagine</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 p-4">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Clicca per caricare</p>
                        <p className="text-xs mt-1 text-gray-300">PNG o JPG</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={inputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(side, e.target.files[0])}
                  />
                </div>
              )
            })}
          </div>

          {/* Print Area */}
          <div>
            <Label className="mb-3 block font-medium">📐 Area di stampa (dove l'utente disegna)</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'xPercent', label: 'X da sinistra (%)' },
                { key: 'yPercent', label: 'Y dall\'alto (%)' },
                { key: 'widthPercent', label: 'Larghezza (%)' },
                { key: 'heightPercent', label: 'Altezza (%)' },
                { key: 'widthCm', label: 'Larghezza reale (cm)' },
                { key: 'heightCm', label: 'Altezza reale (cm)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-xs text-gray-500 mb-1 block">{label}</Label>
                  <Input
                    type="number" step="0.5"
                    value={printArea[key as keyof PrintArea]}
                    onChange={e => setPrintArea(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              I valori % indicano dove appare l'area di personalizzazione sull'immagine mockup (0-100).
              Default: X=25, Y=20, W=50, H=45 — regola in base alle tue immagini.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvataggio...</>
              : `Salva mockup per ${colorName}`
            }
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── PAGINA PRINCIPALE ────────────────────────────────────────────────────────

export default function AdminMockupsPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [savedMockups, setSavedMockups] = useState<Record<string, Record<string, ColorMockup>>>({})
  const [loading, setLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const prods = await getShopifyProducts()
      setProducts(prods)

      const mockupsMap: Record<string, Record<string, ColorMockup>> = {}
      await Promise.all(prods.map(async p => {
        const id = HANDLE_TO_SHOPIFY_ID[p.handle]
        if (!id) return
        const saved = await getProductMockups(id)
        if (saved?.colors) mockupsMap[id] = saved.colors
      }))
      setSavedMockups(mockupsMap)
    } catch {
      toast.error('Errore caricamento prodotti')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurazione Mockup</h1>
        <p className="text-gray-500 mt-2">
          Per ogni prodotto e ogni colore, carica il mockup fronte e retro che l'utente vedrà nel configuratore.
        </p>
      </div>

      <div className="space-y-6">
        {products.map(product => {
          const shopifyId = HANDLE_TO_SHOPIFY_ID[product.handle]
          const colors = getUniqueColors(product)
          const saved = savedMockups[shopifyId] ?? {}
          const configuredCount = Object.keys(saved).length
          const isExpanded = expandedProduct === product.handle

          return (
            <Card key={product.handle} className="overflow-hidden">
              {/* Header prodotto */}
              <button
                onClick={() => setExpandedProduct(isExpanded ? null : product.handle)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {product.images.edges[0]?.node.url && (
                    <img
                      src={product.images.edges[0].node.url}
                      alt={product.title}
                      className="w-14 h-14 object-cover rounded-lg border"
                    />
                  )}
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{product.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">
                        {colors.length} colori
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className={`text-sm font-medium ${configuredCount === colors.length ? 'text-green-600' : configuredCount > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                        {configuredCount}/{colors.length} configurati
                      </span>
                    </div>
                    {/* Mini swatches */}
                    <div className="flex gap-1 mt-2">
                      {colors.map(c => (
                        <div
                          key={c}
                          title={c}
                          className={`w-4 h-4 rounded-full border ${saved[c] ? 'border-green-500 ring-1 ring-green-400' : 'border-gray-300'}`}
                          style={{ backgroundColor: FALLBACK_HEX[c] ?? '#ccc' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {configuredCount === colors.length && colors.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">✅ Completo</span>
                  )}
                  {configuredCount > 0 && configuredCount < colors.length && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">⚠️ Parziale</span>
                  )}
                  {configuredCount === 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">Non configurato</span>
                  )}
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </button>

              {/* Lista colori */}
              {isExpanded && (
                <div className="border-t p-5 space-y-3 bg-gray-50/50">
                  {colors.map(colorName => (
                    <ColorRow
                      key={colorName}
                      productId={shopifyId}
                      handle={product.handle}
                      colorName={colorName}
                      savedMockup={saved[colorName]}
                      onSaved={loadAll}
                    />
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
