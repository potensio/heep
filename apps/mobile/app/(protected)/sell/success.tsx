// app/(protected)/sell/success.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SuccessScreen } from '@/features/sell/components/SuccessScreen';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

export default function SuccessStep() {
  const router = useRouter();
  const { publishedProductId, resetForm } = useSellFormContext();

  useEffect(() => {
    if (!publishedProductId) {
      router.replace('/sell/foto');
    }
  }, [publishedProductId, router]);

  if (!publishedProductId) {
    return null;
  }

  const handleBackToHome = () => {
    resetForm();
    router.replace('/(tabs)');
  };

  return (
    <SuccessScreen
      productId={publishedProductId}
      onBackToHome={handleBackToHome}
    />
  );
}
