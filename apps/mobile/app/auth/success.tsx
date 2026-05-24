import { useRouter, useLocalSearchParams } from 'expo-router';
import { SuccessScreen } from '@/features/auth/screens/SuccessScreen';

export default function SuccessRoute() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  return (
    <SuccessScreen
      onStart={() => router.replace((returnTo as any) || '/(tabs)')}
    />
  );
}
