// app/(protected)/_layout.tsx
import { Stack, useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function ProtectedLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sell" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="settings" />
      </Stack>
    </AuthGuard>
  );
}
