import { useRouter, useLocalSearchParams } from 'expo-router';
import { EditSuccessScreen } from '@/features/edit/components/EditSuccessScreen';

export default function EditSuccessRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <EditSuccessScreen
      productId={id}
      onViewProduct={() => router.replace(`/product/${id}` as any)}
      onBackToHome={() => router.replace('/(tabs)' as any)}
    />
  );
}
