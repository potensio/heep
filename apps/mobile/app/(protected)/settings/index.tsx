import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function SettingsIndex() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SettingsScreen
      onNavigateToProfile={() => router.push('/(protected)/settings/profil')}
      onNavigateToPhone={() => router.push('/(protected)/settings/handphone')}
      onNavigateToListings={() => router.push('/(protected)/settings/produk')}
      onNavigateToSaved={() => router.push('/(protected)/settings/saved')}
      onNavigateToNotifications={() => router.push('/(protected)/settings/notifikasi')}
      onLogout={() => {
        logout();
        router.replace('/(tabs)');
      }}
    />
  );
}
