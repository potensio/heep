import { View, Text } from 'react-native';
import { ChatRoundDots } from '@solar-icons/react-native/Linear';

export function EmptyChatState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 bg-neutral-100 rounded-full items-center justify-center mb-4">
        <ChatRoundDots size={40} color="#9CA3AF" />
      </View>
      <Text className="text-lg font-semibold text-neutral-800 mb-2">
        Belum ada pesan
      </Text>
      <Text className="text-sm text-neutral-500 text-center">
        Chat akan muncul ketika ada pembeli yang menghubungi kamu
      </Text>
    </View>
  );
}
