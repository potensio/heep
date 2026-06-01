import { Stack, useRouter } from "expo-router";
import { Platform, TouchableOpacity } from "react-native";
import { ArrowLeft } from "@solar-icons/react-native/Linear";

export default function SettingsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTintColor: "#0A0A0A",
        headerTitleStyle: {
          fontWeight: "500",
        },
        headerBackTitle: Platform.OS === "ios" ? "Kembali" : undefined,
        headerBackVisible: true,
        headerStyle: {
          backgroundColor: "#F9F2E6",
        },
        gestureEnabled: true,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Pengaturan" }} />
      <Stack.Screen
        name="profil"
        options={{
          title: "Profil",
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="px-2">
              <ArrowLeft size={24} color="#0A0A0A" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="handphone"
        options={{
          title: "Nomor Handphone",
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="px-2">
              <ArrowLeft size={24} color="#0A0A0A" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="keamanan"
        options={{
          title: "Keamanan",
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="px-2">
              <ArrowLeft size={24} color="#0A0A0A" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="notifikasi"
        options={{
          title: "Notifikasi",
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="px-2">
              <ArrowLeft size={24} color="#0A0A0A" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
