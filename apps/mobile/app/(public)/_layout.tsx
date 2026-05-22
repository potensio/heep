import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="user/[id]" />
    </Stack>
  );
}
