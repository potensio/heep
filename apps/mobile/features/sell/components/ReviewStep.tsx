// features/sell/components/ReviewStep.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Gallery, PenNewSquare } from '@solar-icons/react-native/Linear';
import { Button } from '@/components/ui/Button';
import { ProductDetail, type ProductDetailData } from '@/features/product/ProductDetail';
import { CATEGORY_OPTIONS } from '../types';
import type { ReviewStepProps } from '../types';

function formatRupiah(value: number): string {
  if (!value || value === 0) return 'Rp 0';
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getCategoryLabel(categoryValue: string): string {
  const category = CATEGORY_OPTIONS.find(cat => cat.value === categoryValue);
  return category?.label || categoryValue;
}

function getConditionLabel(conditionValue: string): string {
  if (!conditionValue) return '-';
  return conditionValue;
}

export function ReviewStep({ 
  formData, 
  isSubmitting, 
  onEditPhotos, 
  onEditInfo, 
  onPublish, 
  onBack 
}: ReviewStepProps) {
  const insets = useSafeAreaInsets();

  // Convert formData to ProductDetailData format
  const productForPreview: ProductDetailData = {
    name: formData.name,
    price: formData.price,
    description: formData.description,
    photos: formData.photos,
    category: getCategoryLabel(formData.category),
    condition: getConditionLabel(formData.condition),
  };

  const footerContent = (
    <View className="flex-row gap-3 items-center">
      <Button variant="outline" size="sm" icon={<ArrowLeft size={18} color="#000000" />} onPress={onBack} disabled={isSubmitting} />
      
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
      showActions={false}
      showSeller={false}
      footerContent={footerContent}
    />
  );
}
