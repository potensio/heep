import { View, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SettingsItem } from "./components/SettingsItem";
import { User, Phone, Shield, Bell, Shop } from "@solar-icons/react-native/Linear";

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
          <View className="gap-2">
            <Text className="text-sm text-gray-500 px-1 mb-1">Akun & Profil</Text>
            <View className="gap-2">
              <SettingsItem
                icon={<User size={20} className="text-gray-700" />}
                label="Profil"
                onPress={() => router.push("/settings/profil")}
              />
              <SettingsItem
                icon={<Phone size={20} className="text-gray-700" />}
                label="Nomor Handphone"
                onPress={() => router.push("/settings/handphone")}
              />
              <SettingsItem
                icon={<Shield size={20} className="text-gray-700" />}
                label="Keamanan"
                onPress={() => router.push("/settings/keamanan")}
              />
            </View>
          </View>

          {/* App Settings Section */}
          <View className="gap-2">
            <Text className="text-sm text-gray-500 px-1 mb-1">Aplikasi</Text>
            <View className="gap-2">
              <SettingsItem
                icon={<Bell size={20} className="text-gray-700" />}
                label="Notifikasi"
                onPress={() => router.push("/settings/notifikasi")}
              />
            </View>
          </View>

          {/* Seller Settings Section */}
          <View className="gap-2">
            <Text className="text-sm text-gray-500 px-1 mb-1">Toko</Text>
            <View className="gap-2">
              <SettingsItem
                icon={<Shop size={20} className="text-gray-700" />}
                label="Toko"
                onPress={() => router.push("/settings/toko")}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
