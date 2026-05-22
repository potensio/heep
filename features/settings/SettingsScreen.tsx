import { View, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SettingsItem } from "./components/SettingsItem";
import { User, Phone, Shield, Bell, Logout } from "@solar-icons/react-native/Linear";

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top > 0 ? insets.top : 24 }}
      >
        <View className="px-5 gap-6">
          {/* Header */}
          <Text className="text-2xl font-heading font-medium">Pengaturan</Text>

          {/* Profile & Account Section */}
          <View>
            <Text className="text-sm text-gray-500 px-4 mb-2">Akun & Profil</Text>
            <View>
              <SettingsItem
                icon={<User size={20} className="text-gray-700" />}
                label="Profil"
                onPress={() => router.push("/settings/profil")}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Phone size={20} className="text-gray-700" />}
                label="Nomor Handphone"
                onPress={() => router.push("/settings/handphone")}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Shield size={20} className="text-gray-700" />}
                label="Keamanan"
                onPress={() => router.push("/settings/keamanan")}
              />
            </View>
          </View>

          {/* App Settings Section */}
          <View>
            <Text className="text-sm text-gray-500 px-4 mb-2">Aplikasi</Text>
            <View>
              <SettingsItem
                icon={<Bell size={20} className="text-gray-700" />}
                label="Notifikasi"
                onPress={() => router.push("/settings/notifikasi")}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Logout size={20} className="text-accent-red" />}
                label="Keluar"
                onPress={() => router.replace("/auth")}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
