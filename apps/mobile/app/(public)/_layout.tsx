import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="search" />
      <Stack.Screen name="user/[id]" />
    </Stack>
  );
}
