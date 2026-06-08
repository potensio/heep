import { useRouter } from 'expo-router';
import { SignupScreen } from '@/features/auth/screens/signup-screen';
import { useSignupMutation } from '@/features/auth/hooks/use-auth';

export default function SignupRoute() {
  const router = useRouter();
  const mutation = useSignupMutation();

  return (
    <SignupScreen
      isLoading={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={(data) =>
        mutation.mutate({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        })
      }
      onNavigateToLogin={() => router.replace('/auth/login')}
    />
  );
}
