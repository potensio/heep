import { useRouter, useLocalSearchParams } from 'expo-router';
import { CompleteProfileScreen } from '@/features/auth/screens/CompleteProfileScreen';
import { useAuth } from '@/context/AuthContext';
import type { VerifiedUser } from '@/lib/api';

export default function CompleteProfileRoute() {
  const router = useRouter();
  const { login } = useAuth();
  const { email, accessToken, refreshToken, returnTo } = useLocalSearchParams<{
    email: string;
    accessToken: string;
    refreshToken: string;
    returnTo?: string;
  }>();

  if (!accessToken || !refreshToken) {
    router.replace('/auth');
    return null;
  }

  const handleSubmit = (user: VerifiedUser) => {
    login(user, accessToken, refreshToken);
    router.push({ pathname: '/auth/success', params: { returnTo: returnTo ?? '' } });
  };

  return (
    <CompleteProfileScreen
      email={email ?? ''}
      token={accessToken}
      onSubmit={handleSubmit}
    />
  );
}
