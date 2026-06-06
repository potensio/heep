import { useRouter } from 'expo-router';
import { SignupScreen } from '@/features/auth/screens/signup-screen';

export default function SignupRoute() {
  const router = useRouter();

  return (
    <SignupScreen
      onSubmit={(data) => {
        router.push({
          pathname: '/auth/otp',
          params: { email: data.email, type: 'signup' },
        });
      }}
      onNavigateToLogin={() => router.push('/auth/login')}
    />
  );
}
