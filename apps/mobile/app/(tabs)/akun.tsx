import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function AccountTab() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SettingsScreen
      onNavigateToProfile={() => router.push('/(protected)/settings/profil')}
      onNavigateToPhone={() => router.push('/(protected)/settings/handphone')}
      onNavigateToSecurity={() => router.push('/(protected)/settings/keamanan')}
      onNavigateToNotifications={() => router.push('/(protected)/settings/notifikasi')}
      onLogout={() => {
        logout();
        router.replace('/auth');
      }}
    />
  );
}
