import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LoginScreen } from '@/features/auth/screens/login-screen';
import { loginApi } from '@/features/auth/api/auth.api';
import { saveTokens } from '@/features/auth/store/auth.store';

export default function LoginRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoginScreen
      isLoading={isLoading}
      onSubmit={async (data) => {
        setIsLoading(true);
        try {
          const { accessToken, refreshToken } = await loginApi(data.email, data.password);
          saveTokens(accessToken, refreshToken);
          router.replace('/(tabs)');
        } catch {
          // Error is shown via react-hook-form or toast — surface via setError if needed
        } finally {
          setIsLoading(false);
        }
      }}
      onNavigateToSignup={() => router.push('/auth/signup')}
    />
  );
}
