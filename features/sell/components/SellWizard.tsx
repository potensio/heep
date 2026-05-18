import { View, TouchableOpacity, Text } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle } from '@solar-icons/react-native/Linear';
import { useSellForm } from '../hooks/useSellForm';
import { StepIndicator } from './StepIndicator';
import { PhotoUploadStep } from './PhotoUploadStep';
import { ProductInfoStep } from './ProductInfoStep';
import { ReviewStep } from './ReviewStep';
import { SuccessScreen } from './SuccessScreen';
import type { SellFormData } from '../types';

interface SellWizardProps {
  onPublish: (formData: SellFormData) => Promise<string>;
  onViewProduct: (productId: string) => void;
  onCancel: () => void;
  isDevMode?: boolean;
}

export function SellWizard({ onPublish, onViewProduct, onCancel, isDevMode = false }: SellWizardProps) {
  const insets = useSafeAreaInsets();
  const {
    currentStep,
    formData,
    isSubmitting,
    error,
    updateFormData,
    goToStep,
    nextStep,
    prevStep,
    resetForm,
    setSubmitting,
  } = useSellForm();

  const [publishedProductId, setPublishedProductId] = useState<string | null>(null);

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const productId = await onPublish(formData);
      setPublishedProductId(productId);
    } catch (err) {
      console.error('Publish failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellAgain = () => {
    setPublishedProductId(null);
    resetForm();
  };

  // Show success screen after publish
  if (publishedProductId) {
    return (
      <SuccessScreen
        productId={publishedProductId}
        onViewProduct={() => onViewProduct(publishedProductId)}
        onSellAgain={handleSellAgain}
        onBackToHome={onCancel}
      />
    );
  }

  return (
    <View className="flex-1 bg-[#F9F2E6]" style={{ paddingTop: insets.top }}>
      {/* Header with Step Indicator and Close Button */}
      <View className="relative">
        <StepIndicator 
          currentStep={currentStep} 
          stepLabels={['Foto', 'Informasi', 'Review']} 
        />
        
        {/* Close Button */}
        <TouchableOpacity
          onPress={onCancel}
          className="absolute right-4 top-3 z-10"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseCircle size={28} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Step Content */}
      {currentStep === 1 && (
        <PhotoUploadStep
          photos={formData.photos}
          onPhotosChange={(photos) => updateFormData({ photos })}
          onNext={nextStep}
          isDevMode={isDevMode}
        />
      )}

      {currentStep === 2 && (
        <ProductInfoStep
          formData={formData}
          onFormChange={updateFormData}
          onNext={nextStep}
          onBack={prevStep}
          isDevMode={isDevMode}
        />
      )}

      {currentStep === 3 && (
        <ReviewStep
          formData={formData}
          isSubmitting={isSubmitting}
          onEditPhotos={() => goToStep(1)}
          onEditInfo={() => goToStep(2)}
          onPublish={handlePublish}
          onBack={prevStep}
        />
      )}
    </View>
  );
}
