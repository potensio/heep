// app/(protected)/sell/review.tsx
import { useRouter } from 'expo-router';
import { ReviewStep } from '@/features/sell/components/ReviewStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';
import { useAuth } from '@/context/AuthContext';
import { publishProduct } from '@/lib/api';

export default function ReviewStepRoute() {
  const router = useRouter();
  const { formData, isSubmitting, setSubmitting, setPublishedProductId } = useSellFormContext();
  const { token } = useAuth();

  const handleEditPhotos = () => { router.push('/sell/foto'); };
  const handleEditInfo = () => { router.push('/sell/info'); };

  const handlePublish = async () => {
    if (!token || !formData.location) return;
    setSubmitting(true);
    try {
      const productId = await publishProduct(token, formData.photos, {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        category: formData.category as string,
        subcategory: formData.subcategory as string,
        attributes: formData.attributes,
        location: formData.location,
        listingStatus: 'active',
      });
      setPublishedProductId(productId);
      router.replace('/sell/success');
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => { router.back(); };

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
