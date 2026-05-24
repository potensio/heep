import { useRouter, useLocalSearchParams } from 'expo-router';
import { PhoneScreen } from '@/features/auth/screens/PhoneScreen';

export default function AuthIndex() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  return (
    <PhoneScreen
      onSubmit={(phone) =>
        router.push({ pathname: '/auth/otp', params: { phone, returnTo: returnTo ?? '' } })
      }
      onGuestLogin={() => router.replace((returnTo as any) || '/(tabs)')}
    />
  );
}
