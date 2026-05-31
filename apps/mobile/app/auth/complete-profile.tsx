import { useRouter, useLocalSearchParams } from 'expo-router';
import { CompleteProfileScreen } from '@/features/auth/screens/CompleteProfileScreen';
import { useAuth } from '@/context/AuthContext';
import type { VerifiedUser } from '@/lib/api';

export default function CompleteProfileRoute() {
  const router = useRouter();
  const { login } = useAuth();
  const { email, token, returnTo } = useLocalSearchParams<{
    email: string;
    token: string;
    returnTo?: string;
  }>();

  if (!token) {
    router.replace('/auth');
    return null;
  }

  const handleSubmit = (user: VerifiedUser) => {
    login(user, token);
    router.push({ pathname: '/auth/success', params: { returnTo: returnTo ?? '' } });
  };

  return (
    <CompleteProfileScreen
      email={email ?? ''}
      token={token}
      onSubmit={handleSubmit}
    />
  );
}
