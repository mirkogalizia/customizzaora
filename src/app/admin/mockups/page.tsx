'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getShopifyProducts, ShopifyProduct } from '@/lib/shopify/storefront'
import {
  getProductMockups, saveColorMockup, saveProductPrintAreas,
  uploadMockupImage, ColorMockup, PrintAreas, DEFAULT_PRINT_AREAS
} from '@/lib/firebase/mockups'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Check, ChevronDown, ChevronUp, Settings } from 'lucide-react'
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

// ─── COMPONENTE ANTEPRIMA PRINT AREA ─────────────────────────────────────────

function PrintAreaPreview({ mockupUrl, printArea, side }: {
  mockupUrl: string
  printArea: { xPercent: number; yPercent: number; widthPercent: number; heightPercent: number }
  side: string
}) {
  return (
    <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-gray-100">
      <img src={mockupUrl} alt={side} className="w-full h-full object-contain" />
      {/* Overlay area di stampa */}
      <div
        className="absolute border-2 border-dashed border-orange-500 bg-orange-500/10"
        style={{
          left: `${printArea.xPercent}%`,
          top: `${printArea.yPercent}%`,
          width: `${printArea.widthPercent}%`,
          height: `${printArea.heightPercent}%`,
        }}
      >
        <span className="absolute top-1 left-1 text-xs bg-orange-500 text-white px-1 rounded font-bold">
          Area stampa
        </span>
      </div>
    </div>
  )
}

// ─── SEZIONE PRINT AREA PER PRODOTTO ─────────────────────────────────────────

function PrintAreaSection({ productId, handle, savedPrintAreas, previewFront, previewBack, onSaved }: {
  productId: string
  handle: string
  savedPrintAreas: PrintAreas
  previewFront?: string
  previewBack?: string
  onSaved: () => void
}) {
  const [areas, setAreas] = useState<PrintAreas>(savedPrintAreas)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const update = (side: 'front' | 'back', key: string, val: number) => {
    setAreas(prev => ({ ...prev, [side]: { ...prev[side], [key]: val } }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveProductPrintAreas(productId, handle, areas)
      toast.success('✅ Aree di stampa salvate!')
      onSaved()
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message ?? 'Errore salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const FIELDS = [
    { key: 'xPercent', label: 'X (%)' },
    { key: 'yPercent', label: 'Y (%)' },
    { key: 'widthPercent', label: 'Larghezza (%)' },
    { key: 'heightPercent', label: 'Altezza (%)' },
    { key: 'widthCm', label: 'Larghezza reale (cm)' },
    { key: 'heightCm', label: 'Altezza reale (cm)' },
  ]

  return (
    <div className="border-2 border-orange-200 rounded-lg overflow-hidden bg-orange-50/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-orange-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-orange-600" />
          <span className="font-semibold text-orange-700">📐 Aree di stampa (Fronte + Retro)</span>
          <span className="text-xs text-gray-500">— condivise tra tutti i colori</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="p-5 border-t space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {(['front', 'back'] as const).map(side => (
              <div key={side}>
                <h4 className="font-medium mb-3 text-gray-700">
                  {side === 'front' ? '👕 Fronte' : '🔄 Retro'}
                </h4>

                {/* Anteprima visiva */}
                {(side === 'front' ? previewFront : previewBack) && (
                  <div className="mb-3">
                    <PrintAreaPreview
                      mockupUrl={(side === 'front' ? previewFront : previewBack)!}
                      printArea={areas[side]}
                      side={side}
                    />
                  </div>
                )}

                {/* Campi numerici */}
                <div className="grid grid-cols-2 gap-2">
                  {FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-xs text-gray-500 mb-1 block">{label}</Label>
                      <Input
                        type="number" step="0.5"
                        value={areas[side][key as keyof typeof areas.front]}
                        onChange={e => update(side, key, parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700">
            {saving
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvataggio...</>
              : '💾 Salva aree di stampa'
            }
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── RIGA SINGOLO COLORE ──────────────────────────────────────────────────────

function ColorRow({ productId, handle, colorName, savedMockup, onSaved }: {
  productId: string
  handle: string
  colorName: string
  savedMockup?: ColorMockup
  onSaved: () => void
}) {
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string>(savedMockup?.mockupFront ?? '')
  const [backPreview, setBackPreview] = useState<string>(savedMockup?.mockupBack ?? '')
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(!savedMockup?.mockupFront)
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  const isSaved = !!savedMockup?.mockupFront
  const hex = FALLBACK_HEX[colorName] ?? '#CCCCCC'

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
        colorName, colorHex: hex, mockupFront: finalFront, mockupBack: finalBack,
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
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200" style={{ backgroundColor: hex }} />
          <span className="font-medium">{colorName}</span>
          {isSaved
            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" />OK</span>
            : <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Mancante</span>
          }
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="p-5 border-t bg-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {(['front', 'back'] as const).map(side => {
              const preview = side === 'front' ? frontPreview : backPreview
              const inputRef = side === 'front' ? frontRef : backRef
              return (
                <div key={side}>
                  <Label className="mb-2 block font-medium">{side === 'front' ? '👕 Fronte' : '🔄 Retro'}</Label>
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all overflow-hidden bg-white relative"
                  >
                    {preview ? (
                      <>
                        <img src={preview} alt={side} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Cambia</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 p-4">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Clicca per caricare</p>
                      </div>
                    )}
                  </div>
                  <input ref={inputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(side, e.target.files[0])} />
                </div>
              )
            })}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvataggio...</> : `Salva ${colorName}`}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── PAGINA PRINCIPALE ────────────────────────────────────────────────────────

export default function AdminMockupsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [savedData, setSavedData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  useEffect(() => { if (!authLoading && !user) router.push('/login') }, [user, authLoading, router])
  useEffect(() => { if (user) loadAll() }, [user])

  const loadAll = async () => {
    setLoading(true)
    try {
      const prods = await getShopifyProducts()
      setProducts(prods)
      const map: Record<string, any> = {}
      await Promise.all(prods.map(async p => {
        const id = HANDLE_TO_SHOPIFY_ID[p.handle]
        if (!id) return
        const saved = await getProductMockups(id)
        if (saved) map[id] = saved
      }))
      setSavedData(map)
    } catch { toast.error('Errore caricamento') }
    finally { setLoading(false) }
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configurazione Mockup</h1>
        <p className="text-gray-500 mt-2">
          Per ogni prodotto: imposta le <strong>aree di stampa</strong> (fronte + retro) e carica i <strong>mockup per ogni colore</strong>.
        </p>
      </div>

      <div className="space-y-6">
        {products.map(product => {
          const shopifyId = HANDLE_TO_SHOPIFY_ID[product.handle]
          const colors = getUniqueColors(product)
          const saved = savedData[shopifyId]
          const configuredCount = Object.keys(saved?.colors ?? {}).length
          const isExpanded = expandedProduct === product.handle
          // Prende il primo colore configurato per l'anteprima print area
          const firstConfiguredColor = Object.values(saved?.colors ?? {})[0] as ColorMockup | undefined

          return (
            <Card key={product.handle} className="overflow-hidden">
              <button
                onClick={() => setExpandedProduct(isExpanded ? null : product.handle)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {product.images.edges[0]?.node.url && (
                    <img src={product.images.edges[0].node.url} alt={product.title} className="w-14 h-14 object-cover rounded-lg border" />
                  )}
                  <div>
                    <h2 className="font-bold text-lg">{product.title}</h2>
                    <div className="flex gap-1 mt-1">
                      {colors.map(c => (
                        <div key={c} title={c}
                          className={`w-4 h-4 rounded-full border ${saved?.colors?.[c] ? 'border-green-500 ring-1 ring-green-400' : 'border-gray-300'}`}
                          style={{ backgroundColor: FALLBACK_HEX[c] ?? '#ccc' }}
                        />
                      ))}
                    </div>
                    <p className={`text-sm mt-1 font-medium ${configuredCount === colors.length ? 'text-green-600' : configuredCount > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                      {configuredCount}/{colors.length} colori configurati
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="border-t p-5 space-y-4 bg-gray-50/50">
                  {/* SEZIONE PRINT AREA — una per prodotto */}
                  <PrintAreaSection
                    productId={shopifyId}
                    handle={product.handle}
                    savedPrintAreas={saved?.printAreas ?? DEFAULT_PRINT_AREAS}
                    previewFront={firstConfiguredColor?.mockupFront}
                    previewBack={firstConfiguredColor?.mockupBack}
                    onSaved={loadAll}
                  />

                  {/* COLORI */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Mockup per colore</p>
                    {colors.map(colorName => (
                      <ColorRow
                        key={colorName}
                        productId={shopifyId}
                        handle={product.handle}
                        colorName={colorName}
                        savedMockup={saved?.colors?.[colorName]}
                        onSaved={loadAll}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
