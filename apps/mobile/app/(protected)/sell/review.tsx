// app/(protected)/sell/review.tsx
import { useRouter } from 'expo-router';
import { ReviewStep } from '@/features/sell/components/ReviewStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';
import type { SellFormData } from '@/features/sell/types';

// Mock publish function - will be replaced with actual API call
async function publishProduct(formData: SellFormData): Promise<string> {
  console.log('Publishing product:', formData);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return 'prod_' + Date.now().toString(36);
}

export default function ReviewStepRoute() {
  const router = useRouter();
  const { formData, isSubmitting, setSubmitting, setPublishedProductId } = useSellFormContext();

  const handleEditPhotos = () => {
    router.push('/sell/foto');
  };

  const handleEditInfo = () => {
    router.push('/sell/info');
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const productId = await publishProduct(formData);
      setPublishedProductId(productId);
      router.replace('/sell/success');
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ReviewStep
      formData={formData}
      isSubmitting={isSubmitting}
      onEditPhotos={handleEditPhotos}
      onEditInfo={handleEditInfo}
      onPublish={handlePublish}
      onBack={handleBack}
    />
  );
}
