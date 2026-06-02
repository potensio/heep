import { View, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsItem } from "./components/SettingsItem";
import { User, Phone, Tag, Bookmark, Bell, Logout } from "@solar-icons/react-native/Linear";

interface SettingsScreenProps {
  onNavigateToProfile: () => void;
  onNavigateToPhone: () => void;
  onNavigateToListings: () => void;
  onNavigateToSaved: () => void;
  onNavigateToNotifications: () => void;
  onLogout: () => void;
}

export function SettingsScreen({
  onNavigateToProfile,
  onNavigateToPhone,
  onNavigateToListings,
  onNavigateToSaved,
  onNavigateToNotifications,
  onLogout,
}: SettingsScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top > 0 ? insets.top : 24 }}
      >
        <View className="px-5 gap-6">
          <Text className="text-2xl font-heading font-medium">Pengaturan</Text>

          <View>
            <Text className="text-sm text-gray-500 px-4 mb-2">Akun & Profil</Text>
            <View>
              <SettingsItem
                icon={<User size={20} className="text-gray-700" />}
                label="Profil"
                onPress={onNavigateToProfile}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Phone size={20} className="text-gray-700" />}
                label="Nomor Handphone"
                onPress={onNavigateToPhone}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Tag size={20} className="text-gray-700" />}
                label="Produk Saya"
                onPress={onNavigateToListings}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Bookmark size={20} className="text-gray-700" />}
                label="Produk Disimpan"
                onPress={onNavigateToSaved}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm text-gray-500 px-4 mb-2">Aplikasi</Text>
            <View>
              <SettingsItem
                icon={<Bell size={20} className="text-gray-700" />}
                label="Notifikasi"
                onPress={onNavigateToNotifications}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Logout size={20} className="text-accent-red" />}
                label="Keluar"
                onPress={onLogout}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
