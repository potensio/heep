import { useRouter, useLocalSearchParams } from 'expo-router';
import { OtpScreen } from '@/features/auth/screens/OtpScreen';

export default function OtpRoute() {
  const router = useRouter();
  const { phone, returnTo } = useLocalSearchParams<{ phone: string; returnTo?: string }>();

  return (
    <OtpScreen
      phone={phone ?? ''}
      onVerify={() =>
        router.push({ pathname: '/auth/complete-profile', params: { returnTo: returnTo ?? '' } })
      }
      onBack={() => router.back()}
    />
  );
}
