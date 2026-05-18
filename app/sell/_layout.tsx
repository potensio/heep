import { Stack } from "expo-router";

export default function SellLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }} 
      />
    </Stack>
  );
}
