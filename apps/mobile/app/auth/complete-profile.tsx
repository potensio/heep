import { useRouter, useLocalSearchParams } from 'expo-router';
import { CompleteProfileScreen } from '@/features/auth/screens/CompleteProfileScreen';

export default function CompleteProfileRoute() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  return (
    <CompleteProfileScreen
      onSubmit={() =>
        router.push({ pathname: '/auth/success', params: { returnTo: returnTo ?? '' } })
      }
    />
  );
}
