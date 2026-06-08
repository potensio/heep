import { ImageBackground, View } from 'react-native';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <ImageBackground
      source={require('../../public/auth-image-bg.webp')}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="absolute inset-0 bg-black/30" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'none' }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </ImageBackground>
  );
}
