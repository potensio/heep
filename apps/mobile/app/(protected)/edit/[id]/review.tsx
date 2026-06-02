import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ReviewStep } from '@/features/sell/components/ReviewStep';
import { useEditFormContext } from '@/features/edit/context/EditFormContext';
import { useAuth } from '@/context/AuthContext';
import { updateProduct } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { SellFormData } from '@/features/sell/types';

export default function EditReviewStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formData, isSubmitting, setSubmitting } = useEditFormContext();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const formDataForReview: SellFormData = {
    photos: formData.photos.map(p => (p.kind === 'existing' ? p.url : p.uri)),
    category: formData.category,
    subcategory: formData.subcategory,
    attributes: formData.attributes,
    name: formData.name,
    price: formData.price,
    description: formData.description,
    location: formData.location,
  };

  const handleSave = async () => {
    if (!token || !formData.location) return;
    setSubmitting(true);
    try {
      await updateProduct(token, formData.productId, formData.photos, {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        category: formData.category as string,
        subcategory: formData.subcategory as string,
        attributes: formData.attributes,
        location: formData.location,
        listingStatus: formData.listingStatus,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.product(id) });
      router.replace(`/edit/${id}/success` as any);
    } catch (error) {
      console.error('Update failed:', error);
      Alert.alert('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan perubahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReviewStep
      formData={formDataForReview}
      isSubmitting={isSubmitting}
      onEditPhotos={() => router.push(`/edit/${id}/foto` as any)}
      onEditInfo={() => router.push(`/edit/${id}/info` as any)}
      onPublish={handleSave}
      onBack={() => router.back()}
      publishLabel="Simpan Perubahan"
    />
  );
}
