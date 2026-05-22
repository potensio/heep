// app/(protected)/sell/foto.tsx
import { useRouter } from 'expo-router';
import { PhotoUploadStep } from '@/features/sell/components/PhotoUploadStep';
import { useSellFormContext } from '@/features/sell/context/SellFormContext';

const DEV_MODE = true;

export default function FotoStep() {
  const router = useRouter();
  const { formData, updateFormData } = useSellFormContext();

  const handleNext = () => {
    router.push('/sell/kategori');
  };

  return (
    <PhotoUploadStep
      photos={formData.photos}
      onPhotosChange={(photos) => updateFormData({ photos })}
      onNext={handleNext}
      isDevMode={DEV_MODE}
    />
  );
}
