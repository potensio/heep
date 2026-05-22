// app/(protected)/_layout.tsx
import { Stack, useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/auth?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function ProtectedLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sell/index" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/profil" />
        <Stack.Screen name="settings/handphone" />
        <Stack.Screen name="settings/keamanan" />
        <Stack.Screen name="settings/notifikasi" />
      </Stack>
    </AuthGuard>
  );
}
