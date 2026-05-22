// app/(protected)/sell/success.tsx
import { useRouter } from 'expo-router';
import { SuccessScreen } from '@/features/sell/components/SuccessScreen';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

export default function SuccessStep() {
  const router = useRouter();
  const { publishedProductId, resetForm } = useSellFormContext();

  if (!publishedProductId) {
    // Should not happen, but safety check
    router.replace('/sell/foto');
    return null;
  }

  const handleViewProduct = () => {
    router.push(`/product/${publishedProductId}`);
  };

  const handleBackToHome = () => {
    resetForm();
    router.replace('/(tabs)');
  };

  return (
    <SuccessScreen
      productId={publishedProductId}
      onViewProduct={handleViewProduct}
      onBackToHome={handleBackToHome}
    />
  );
}
