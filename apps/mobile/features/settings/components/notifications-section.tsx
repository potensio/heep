import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export function NotificationsSection() {
  return (
    <View testID="notifications-section" className="bg-white rounded-[32px] p-6 mt-6">
      <Text className="text-xl font-semibold" style={{ marginBottom: 16 }}>
        Notifications
      </Text>
      <VStack className="items-center" style={{ marginTop: 16 }}>
        <Text className="text-sm" style={{ opacity: 0.5 }}>
          Coming soon
        </Text>
      </VStack>
    </View>
  );
}
