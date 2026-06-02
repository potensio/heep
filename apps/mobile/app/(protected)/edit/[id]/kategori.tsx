import { useRouter, useLocalSearchParams } from 'expo-router';
import { CategoryStep } from '@/features/sell/components/CategoryStep';
import { useEditFormContext } from '@/features/edit/context/EditFormContext';

export default function EditKategoriStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formData, updateFormData } = useEditFormContext();

  return (
    <CategoryStep
      selectedCategory={formData.category}
      selectedSubcategory={formData.subcategory}
      onCategorySelect={category => updateFormData({ category, subcategory: '', attributes: {} })}
      onSubcategorySelect={subcategory => updateFormData({ subcategory })}
      onNext={() => router.push(`/edit/${id}/info` as any)}
      onBack={() => router.back()}
    />
  );
}
