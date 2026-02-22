import { db } from '@/lib/firebase/config'
import { uploadFile } from '@/lib/firebase/storage'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'

export interface PrintArea {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  widthCm: number
  heightCm: number
}

export interface PrintAreas {
  front: PrintArea
  back: PrintArea
}

export interface ColorMockup {
  colorName: string
  colorHex: string
  mockupFront: string
  mockupBack: string
}

export interface ProductMockups {
  shopifyProductId: string
  shopifyHandle: string
  printAreas: PrintAreas        // una sola per prodotto, condivisa tra tutti i colori
  colors: Record<string, ColorMockup>
  updatedAt: number
}

const DEFAULT_PRINT_AREAS: PrintAreas = {
  front: { xPercent: 25, yPercent: 20, widthPercent: 50, heightPercent: 45, widthCm: 30, heightCm: 40 },
  back:  { xPercent: 25, yPercent: 20, widthPercent: 50, heightPercent: 45, widthCm: 30, heightCm: 40 },
}

export { DEFAULT_PRINT_AREAS }

export async function uploadMockupImage(
  shopifyProductId: string,
  colorName: string,
  side: 'front' | 'back',
  file: File
): Promise<string> {
  const timestamp = Date.now()
  const extension = file.name.split('.').pop() ?? 'png'
  const safeName = colorName.toLowerCase().replace(/\s+/g, '-')
  const path = `mockups/${shopifyProductId}/${safeName}-${side}-${timestamp}.${extension}`
  return uploadFile(file, path)
}

export async function getProductMockups(shopifyProductId: string): Promise<ProductMockups | null> {
  const snap = await getDoc(doc(db, 'shopify_products', shopifyProductId))
  if (!snap.exists()) return null
  return snap.data() as ProductMockups
}

export async function saveColorMockup(
  shopifyProductId: string,
  shopifyHandle: string,
  colorName: string,
  data: Partial<ColorMockup>
): Promise<void> {
  const docRef = doc(db, 'shopify_products', shopifyProductId)
  const snap = await getDoc(docRef)
  const existing: ProductMockups = snap.exists()
    ? snap.data() as ProductMockups
    : { shopifyProductId, shopifyHandle, colors: {}, printAreas: DEFAULT_PRINT_AREAS, updatedAt: Date.now() }

  existing.colors[colorName] = { ...existing.colors[colorName], ...data, colorName } as ColorMockup
  existing.updatedAt = Date.now()
  await setDoc(docRef, existing)
}

export async function saveProductPrintAreas(
  shopifyProductId: string,
  shopifyHandle: string,
  printAreas: PrintAreas
): Promise<void> {
  const docRef = doc(db, 'shopify_products', shopifyProductId)
  const snap = await getDoc(docRef)
  const existing: ProductMockups = snap.exists()
    ? snap.data() as ProductMockups
    : { shopifyProductId, shopifyHandle, colors: {}, printAreas: DEFAULT_PRINT_AREAS, updatedAt: Date.now() }

  existing.printAreas = printAreas
  existing.updatedAt = Date.now()
  await setDoc(docRef, existing)
}

export async function getAllProductMockups(): Promise<ProductMockups[]> {
  const snap = await getDocs(collection(db, 'shopify_products'))
  return snap.docs.map(d => d.data() as ProductMockups)
}
