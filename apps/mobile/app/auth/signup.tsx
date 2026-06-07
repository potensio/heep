import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SignupScreen } from '@/features/auth/screens/signup-screen';
import { signupApi } from '@/features/auth/api/auth.api';
import { saveTokens } from '@/features/auth/store/auth.store';

export default function SignupRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SignupScreen
      isLoading={isLoading}
      onSubmit={async (data) => {
        setIsLoading(true);
        try {
          const { accessToken, refreshToken } = await signupApi(
            data.firstName,
            data.lastName,
            data.email,
            data.password,
          );
          saveTokens(accessToken, refreshToken);
          router.replace('/(tabs)');
        } catch {
          // Error surfaced via form state or toast
        } finally {
          setIsLoading(false);
        }
      }}
      onNavigateToLogin={() => router.push('/auth/login')}
    />
  );
}
