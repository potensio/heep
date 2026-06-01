// features/sell/components/ReviewStep.tsx
import { View } from 'react-native';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { Button } from '@/components/ui/Button';
import { ProductDetail, type ProductDetailData } from '@/features/product/ProductDetail';
import { CATEGORIES } from '@bantujual/categories';
import type { ReviewStepProps } from '../types';

export function ReviewStep({
  formData,
  isSubmitting,
  onEditPhotos,
  onEditInfo,
  onPublish,
  onBack,
}: ReviewStepProps) {
  const categoryDef = CATEGORIES.find(c => c.id === formData.category);
  const subcategoryDef = categoryDef?.subcategories.find(s => s.id === formData.subcategory);
  const categoryLabel = subcategoryDef
    ? `${categoryDef?.label} › ${subcategoryDef.label}`
    : categoryDef?.label ?? formData.category;

  const productForPreview: ProductDetailData = {
    name: formData.name,
    price: formData.price,
    description: formData.description,
    photos: formData.photos,
    category: categoryLabel,
    condition: formData.attributes.condition ? String(formData.attributes.condition) : undefined,
  };

  const footerContent = (
    <View className="flex-row gap-3 items-center">
      <Button
        variant="outline"
        size="sm"
        icon={<ArrowLeft size={18} color="#000000" />}
        onPress={onBack}
        disabled={isSubmitting}
      />
      <Button
        onPress={onPublish}
        disabled={isSubmitting}
        loading={isSubmitting}
        style={{ flex: 1 }}
      >
        Publish Sekarang
      </Button>
    </View>
  );

  return (
    <ProductDetail
      product={productForPreview}
      showSeller={false}
      footerContent={footerContent}
    />
  );
}
