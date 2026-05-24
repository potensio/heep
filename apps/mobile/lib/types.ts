export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  seller?: string;
  sellerId?: string;
  category?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  image?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  otherUser: User;
  product: Product;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface Order {
  orderNumber: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  productImage?: string;
}

export type ProductCategory =
  | 'komputer'
  | 'handphone-tablet'
  | 'elektronik-lain'
  | 'fashion-pria'
  | 'fashion-wanita'
  | 'sepatu-tas'
  | 'rumah-tangga'
  | 'mobil'
  | 'motor'
  | 'properti'
  | 'hobi-olahraga'
  | 'alat-musik'
  | 'bayi-anak'
  | 'kesehatan-kecantikan'
  | 'makanan-minuman'
  | 'lainnya';

export interface CategoryOption {
  value: ProductCategory;
  label: string;
  icon: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'komputer', label: 'Komputer & Laptop', icon: 'Monitor' },
  { value: 'handphone-tablet', label: 'Handphone & Tablet', icon: 'Mobile' },
  { value: 'elektronik-lain', label: 'Elektronik Lain', icon: 'Cpu' },
  { value: 'fashion-pria', label: 'Fashion Pria', icon: 'TShirt' },
  { value: 'fashion-wanita', label: 'Fashion Wanita', icon: 'Skirt' },
  { value: 'sepatu-tas', label: 'Sepatu & Tas', icon: 'Bag' },
  { value: 'rumah-tangga', label: 'Rumah Tangga', icon: 'House' },
  { value: 'mobil', label: 'Mobil', icon: 'Car' },
  { value: 'motor', label: 'Motor', icon: 'Scooter' },
  { value: 'properti', label: 'Properti', icon: 'Buildings' },
  { value: 'hobi-olahraga', label: 'Hobi & Olahraga', icon: 'Volleyball' },
  { value: 'alat-musik', label: 'Alat Musik', icon: 'MusicNote' },
  { value: 'bayi-anak', label: 'Bayi & Anak', icon: 'Balloon' },
  { value: 'kesehatan-kecantikan', label: 'Kesehatan & Kecantikan', icon: 'Cosmetic' },
  { value: 'makanan-minuman', label: 'Makanan & Minuman', icon: 'Cup' },
  { value: 'lainnya', label: 'Lainnya', icon: 'Widget' },
];

export type ProductCondition = 'Baru' | 'Masih Bagus' | 'Masih Layak' | 'Apa adanya';

export const CONDITION_OPTIONS: ProductCondition[] = [
  'Baru',
  'Masih Bagus',
  'Masih Layak',
  'Apa adanya',
];
