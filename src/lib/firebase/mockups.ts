// src/lib/firebase/mockups.ts
// Gestione mockup per prodotti Shopify su Firestore

import { db, storage } from '@/lib/firebase/config'
import {
  doc, getDoc, setDoc, collection, getDocs
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export interface PrintArea {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  widthCm: number
  heightCm: number
}

export interface ColorMockup {
  colorName: string      // "Black"
  colorHex: string       // "#000000"
  mockupFront: string    // URL Firebase Storage
  mockupBack: string     // URL Firebase Storage
  printArea: PrintArea
}

export interface ProductMockups {
  shopifyProductId: string
  shopifyHandle: string
  colors: Record<string, ColorMockup> // key = colorName
  updatedAt: number
}

// Legge tutti i mockup di un prodotto
export async function getProductMockups(shopifyProductId: string): Promise<ProductMockups | null> {
  const docRef = doc(db, 'shopify_products', shopifyProductId)
  const snap = await getDoc(docRef)
  if (!snap.exists()) return null
  return snap.data() as ProductMockups
}

// Salva i mockup di un colore specifico
export async function saveColorMockup(
  shopifyProductId: string,
  shopifyHandle: string,
  colorName: string,
  data: Partial<ColorMockup>
): Promise<void> {
  const docRef = doc(db, 'shopify_products', shopifyProductId)
  const snap = await getDoc(docRef)
  const existing = snap.exists() ? snap.data() as ProductMockups : {
    shopifyProductId,
    shopifyHandle,
    colors: {},
    updatedAt: Date.now(),
  }

  existing.colors[colorName] = {
    ...existing.colors[colorName],
    ...data,
    colorName,
  } as ColorMockup
  existing.updatedAt = Date.now()

  await setDoc(docRef, existing)
}

// Upload immagine mockup su Firebase Storage
export async function uploadMockupImage(
  shopifyProductId: string,
  colorName: string,
  side: 'front' | 'back',
  file: File
): Promise<string> {
  const path = `mockups/${shopifyProductId}/${colorName}/${side}_${Date.now()}.${file.name.split('.').pop()}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

// Lista tutti i prodotti che hanno mockup configurati
export async function getAllProductMockups(): Promise<ProductMockups[]> {
  const col = collection(db, 'shopify_products')
  const snap = await getDocs(col)
  return snap.docs.map(d => d.data() as ProductMockups)
}
