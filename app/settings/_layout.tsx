import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTintColor: "#0A0A0A",
        headerTitleStyle: {
          fontWeight: "500",
        },
        headerBackTitle: "Kembali",
      }}
    >
      <Stack.Screen name="profil" options={{ title: "Profil" }} />
      <Stack.Screen name="handphone" options={{ title: "Nomor Handphone" }} />
      <Stack.Screen name="keamanan" options={{ title: "Keamanan" }} />
      <Stack.Screen name="notifikasi" options={{ title: "Notifikasi" }} />
      <Stack.Screen name="toko" options={{ title: "Toko" }} />
    </Stack>
  );
}
