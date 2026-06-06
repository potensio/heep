import { useRouter } from 'expo-router';
import { LoginScreen } from '@/features/auth/screens/login-screen';

export default function LoginRoute() {
  const router = useRouter();

  return (
    <LoginScreen
      onSubmit={(data) => {
        router.push({
          pathname: '/auth/otp',
          params: { email: data.email, type: 'login' },
        });
      }}
      onNavigateToSignup={() => router.push('/auth/signup')}
    />
  );
}
