import { Stack, useRouter } from 'expo-router';
import { Platform, TouchableOpacity, View } from 'react-native';
import { Share, ArrowLeft } from '@solar-icons/react-native/Linear';

export default function PublicLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTintColor: '#0A0A0A',
        headerTitleStyle: {
          fontWeight: '500',
        },
        headerBackTitle: Platform.OS === 'ios' ? 'Kembali' : undefined,
        headerStyle: {
          backgroundColor: '#F9F2E6',
        },
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="user/[id]" />
    </Stack>
  );
}
