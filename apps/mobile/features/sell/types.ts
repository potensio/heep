import type { ProductCategory, ProductCondition } from '@/lib/types';

export interface SellFormData {
  photos: string[];
  category: ProductCategory | '';
  condition: ProductCondition | '';
  name: string;
  price: number;
  description: string;
}

export type WizardStep = 1 | 2 | 3 | 4;

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

export interface CategoryStepProps {
  selectedCategory: ProductCategory | '';
  onCategorySelect: (category: ProductCategory) => void;
  onNext: () => void;
  onBack: () => void;
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
  onBackToHome?: () => void;
}
