import { useRouter, useLocalSearchParams } from 'expo-router';
import { EmailScreen } from '@/features/auth/screens/EmailScreen';

export default function AuthIndex() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  return (
    <EmailScreen
      onSubmit={(email) =>
        router.push({ pathname: '/auth/otp', params: { email, returnTo: returnTo ?? '' } })
      }
      onGuestLogin={() => {
        const destination = returnTo && !returnTo.startsWith('/(protected)') ? returnTo : '/(tabs)';
        router.replace(destination as any);
      }}
    />
  );
}
