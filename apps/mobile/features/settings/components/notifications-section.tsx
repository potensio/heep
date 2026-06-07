import { useState } from 'react';
import { Switch, Pressable, Linking, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';

export function NotificationsSection() {
  const [enabled, setEnabled] = useState(true);

  return (
    <VStack testID="notifications-section">
      <Text className="text-xl font-bold" style={{ marginBottom: 12 }}>
        Notifications
      </Text>

      <Box className="bg-white rounded-[32px] p-6">
        {/* Description */}
        <Text className="text-sm" style={{ color: '#444444', marginBottom: 20, lineHeight: 20 }}>
          Enable notifications to be alerted when the AI needs your attention. This may include
          situations like: unusual customer questions, urgent requests, booking issues, or
          conversations where human help is preferred. If enabled, you'll receive a mobile
          notification when action is required.
        </Text>

        {/* Column header row */}
        <HStack className="justify-between items-center" style={{ marginBottom: 10 }}>
          <Text className="text-xs" style={{ color: '#888888' }}>
            Name
          </Text>
          <Text className="text-xs" style={{ color: '#888888' }}>
            Notifications
          </Text>
        </HStack>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#e5e5e5', marginBottom: 12 }} />

        {/* Data row */}
        <HStack className="justify-between items-center" style={{ marginBottom: 16 }}>
          <Text className="text-base font-bold">Le Restaurante</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#d1d5db', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </HStack>

        {/* Allow push notifications link */}
        <HStack className="justify-end">
          <Pressable onPress={() => Linking.openSettings()}>
            <Text className="text-xs" style={{ color: '#9ca3af' }}>
              Allow push notifications
            </Text>
          </Pressable>
        </HStack>
      </Box>
    </VStack>
  );
}
