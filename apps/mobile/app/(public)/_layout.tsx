import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="beranda" />
      <Stack.Screen name="cari" />
      <Stack.Screen name="product/[id]" />
    </Stack>
  );
}
