import { useRouter } from 'expo-router';
import { LoginScreen } from '@/features/auth/screens/login-screen';
import { useLoginMutation } from '@/features/auth/hooks/use-auth';

export default function LoginRoute() {
  const router = useRouter();
  const mutation = useLoginMutation();

  return (
    <LoginScreen
      isLoading={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={(data) => mutation.mutate({ email: data.email, password: data.password })}
      onNavigateToSignup={() => router.replace('/auth/signup')}
    />
  );
}
