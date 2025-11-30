import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './config';
import { Product, ProductVariant, Color } from '@/types';

export async function getProducts() {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const products = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Product));
    
    return products;
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (error) {
    console.error('Error in getProduct:', error);
    return null;
  }
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'products'), {
    ...data,
    images: data.images || [],
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, 'products', id));
}

export async function getColors(productId: string): Promise<Color[]> {
  try {
    const colorsRef = collection(db, 'products', productId, 'colors');
    const snapshot = await getDocs(colorsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Color));
  } catch (error) {
    console.error('Error in getColors:', error);
    return [];
  }
}

export async function getVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const variantsRef = collection(db, 'products', productId, 'variants');
    const snapshot = await getDocs(variantsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductVariant));
  } catch (error) {
    console.error('Error in getVariants:', error);
    return [];
  }
}

export async function createVariant(productId: string, data: Omit<ProductVariant, 'id' | 'productId'>) {
  const variantsRef = collection(db, 'products', productId, 'variants');
  const docRef = await addDoc(variantsRef, {
    ...data,
    productId,
  });
  return docRef.id;
}

export async function updateVariant(productId: string, variantId: string, data: Partial<ProductVariant>) {
  const docRef = doc(db, 'products', productId, 'variants', variantId);
  await updateDoc(docRef, data);
}

