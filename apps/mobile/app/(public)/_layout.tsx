import { Stack, useRouter } from 'expo-router';
import { Platform, TouchableOpacity, View } from 'react-native';
import { Heart, Share, ArrowLeft } from '@solar-icons/react-native/Linear';

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
          title: '',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="px-2">
              <ArrowLeft size={24} color="#0A0A0A" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => {}} className="p-1">
                <Share size={22} color="#0A0A0A" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}} className="p-1">
                <Heart size={22} color="#0A0A0A" />
              </TouchableOpacity>
            </View>
          ),
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
