// app/(protected)/sell/kategori.tsx
import { useRouter } from 'expo-router';
import { CategoryStep } from '@/features/sell/components/CategoryStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

export default function KategoriStep() {
  const router = useRouter();
  const { formData, updateFormData } = useSellFormContext();

  const handleNext = () => {
    router.push('/sell/info');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <CategoryStep
      selectedCategory={formData.category}
      selectedSubcategory={formData.subcategory}
      onCategorySelect={(category) => updateFormData({ category, subcategory: '', attributes: {} })}
      onSubcategorySelect={(subcategory) => updateFormData({ subcategory })}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
