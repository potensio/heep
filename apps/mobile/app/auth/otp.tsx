import { useRouter, useLocalSearchParams } from 'expo-router';
import { OtpScreen } from '@/features/auth/screens/OtpScreen';
import { useAuth } from '@/context/AuthContext';

export default function OtpRoute() {
  const router = useRouter();
  const { login } = useAuth();
  const { email, returnTo } = useLocalSearchParams<{ email: string; returnTo?: string }>();

  return (
    <OtpScreen
      email={email ?? ''}
      onSuccess={(user, accessToken, refreshToken) => {
        if (!user.profileCompleted) {
          router.push({
            pathname: '/auth/complete-profile',
            params: { accessToken, refreshToken, email: user.email, returnTo: returnTo ?? '' },
          });
        } else {
          login(user, accessToken, refreshToken);
          router.replace((returnTo as any) || '/(tabs)');
        }
      }}
      onBack={() => router.back()}
    />
  );
}
