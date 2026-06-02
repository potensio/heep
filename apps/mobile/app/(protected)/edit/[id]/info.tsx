import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProductInfoStep } from '@/features/sell/components/ProductInfoStep';
import { useEditFormContext } from '@/features/edit/context/EditFormContext';
import type { SellFormData } from '@/features/sell/types';

export default function EditInfoStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formData, updateFormData } = useEditFormContext();

  const sellFormData: SellFormData = {
    photos: [],
    category: formData.category,
    subcategory: formData.subcategory,
    attributes: formData.attributes,
    name: formData.name,
    price: formData.price,
    description: formData.description,
    location: formData.location,
  };

  return (
    <ProductInfoStep
      formData={sellFormData}
      onFormChange={(updates) => {
        const { photos: _photos, ...rest } = updates;
        updateFormData(rest);
      }}
      onNext={() => router.push(`/edit/${id}/review` as any)}
      onBack={() => router.back()}
    />
  );
}
