// features/sell/types.ts

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

export interface SellFormData {
  photos: string[];
  category: ProductCategory | '';
  name: string;
  price: number;
  description: string;
}

export type WizardStep = 1 | 2 | 3;

export interface SellWizardState {
  currentStep: WizardStep;
  formData: SellFormData;
  isSubmitting: boolean;
  error: string | null;
}

export interface SellWizardProps {
  onPublish: (formData: SellFormData) => Promise<string>;
  onViewProduct: (productId: string) => void;
  onCancel: () => void;
  isDevMode?: boolean;
}

export interface PhotoUploadStepProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
  isDevMode?: boolean;
}

export interface ProductInfoStepProps {
  formData: SellFormData;
  onFormChange: (data: Partial<SellFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  isDevMode?: boolean;
}

export interface ReviewStepProps {
  formData: SellFormData;
  isSubmitting: boolean;
  onEditPhotos: () => void;
  onEditInfo: () => void;
  onPublish: () => void;
  onBack: () => void;
}

export interface SuccessScreenProps {
  productId: string;
  onViewProduct: () => void;
  onSellAgain: () => void;
  onBackToHome?: () => void;
}
