import type { CategoryId, SubcategoryId } from '@bantujual/categories';
import type { Location } from '@/lib/types';

export interface SellFormData {
  photos: string[];
  category: CategoryId | '';
  subcategory: SubcategoryId | '';
  attributes: Record<string, string | number>;
  name: string;
  price: number;
  description: string;
  location: Location | null;
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
  onCancel: () => void;
}

export interface PhotoUploadStepProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
}

export interface CategoryStepProps {
  selectedCategory: CategoryId | '';
  selectedSubcategory: SubcategoryId | '';
  onCategorySelect: (category: CategoryId) => void;
  onSubcategorySelect: (subcategory: SubcategoryId) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface ProductInfoStepProps {
  formData: SellFormData;
  onFormChange: (data: Partial<SellFormData>) => void;
  onNext: () => void;
  onBack: () => void;
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
  onBackToHome: () => void;
}
