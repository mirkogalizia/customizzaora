import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    console.log('📤 Uploading file to:', path);
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    
    console.log('✅ Upload complete:', snapshot.metadata.fullPath);

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

export async function uploadProductImage(
  file: File, 
  productId: string, 
  type: 'main' | 'mockup' | 'gallery'
): Promise<string> {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `products/${productId}/${type}-${timestamp}.${extension}`;
  return uploadFile(file, path);
}

export async function uploadMockup(
  file: File,
  productId: string,
  colorName: string,
  side: 'front' | 'back'
): Promise<string> {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const safeName = colorName.toLowerCase().replace(/\s+/g, '-');
  const path = `mockups/${productId}/${safeName}-${side}-${timestamp}.${extension}`;
  return uploadFile(file, path);
}

export async function uploadDesignAsset(
  file: File,
  userId: string,
  designId: string
): Promise<string> {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `designs/${userId}/${designId}-${timestamp}.${extension}`;
  return uploadFile(file, path);
}

