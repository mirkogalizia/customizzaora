export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'tshirt' | 'hoodie' | 'sweatshirt';
  basePrice: number;
  mainImage?: string;
  images?: string[];
  isActive: boolean;
  printAreas?: {
    front: PrintAreaDimensions;
    back: PrintAreaDimensions;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PrintAreaDimensions {
  // Percentuali RELATIVE all'immagine del mockup (0-100)
  xPercent: number;      // % da sinistra dell'immagine
  yPercent: number;      // % dall'alto dell'immagine
  widthPercent: number;  // % larghezza dell'immagine
  heightPercent: number; // % altezza dell'immagine
  
  // Dimensioni REALI per file di stampa
  widthCm: number;
  heightCm: number;
}

export interface Color {
  id: string;
  productId: string;
  name: string;
  hex: string;
  mockupFront: string;
  mockupBack: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string;
  colorHex: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  sku: string;
  extraPrice: number;
  stock: number;
  isActive: boolean;
}

export interface PrintArea {
  id: string;
  name: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  dpi: number;
}

export interface Design {
  id: string;
  userId?: string;
  guestId?: string;
  productId: string;
  colorId: string;
  size: string;
  designs: {
    front?: DesignSide;
    back?: DesignSide;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DesignSide {
  elements: DesignElement[];
  previewImageUrl?: string;
}

export interface DesignElement {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  imageUrl?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface Order {
  id: string;
  userId?: string;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  colorId: string;
  colorName: string;
  size: string;
  designId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumbnailUrl?: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  size: string;
  designId?: string;
  quantity: number;
  unitPrice: number;
  thumbnailUrl?: string;
}
