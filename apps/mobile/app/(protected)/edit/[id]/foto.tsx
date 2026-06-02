import { useRouter, useLocalSearchParams } from 'expo-router';
import { EditPhotoUploadStep } from '@/features/edit/components/EditPhotoUploadStep';
import { useEditFormContext } from '@/features/edit/context/EditFormContext';

export default function EditFotoStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formData, updateFormData } = useEditFormContext();

  return (
    <EditPhotoUploadStep
      photos={formData.photos}
      onPhotosChange={photos => updateFormData({ photos })}
      onNext={() => router.push(`/edit/${id}/kategori` as any)}
    />
  );
}
