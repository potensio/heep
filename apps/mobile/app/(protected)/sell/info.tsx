// app/(protected)/sell/info.tsx
import { useRouter } from 'expo-router';
import { ProductInfoStep } from '@/features/sell/components/ProductInfoStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

const DEV_MODE = true;

export default function InfoStep() {
  const router = useRouter();
  const { formData, updateFormData } = useSellFormContext();

  const handleNext = () => {
    router.push('/sell/review');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ProductInfoStep
      formData={formData}
      onFormChange={updateFormData}
      onNext={handleNext}
      onBack={handleBack}
      isDevMode={DEV_MODE}
    />
  );
}
