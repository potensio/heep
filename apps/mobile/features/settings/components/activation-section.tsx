import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';

type AiState = 'on' | 'off';

function AiToggle({
  value,
  onChange,
}: {
  value: AiState;
  onChange: (v: AiState) => void;
}) {
  const activeStyle = { backgroundColor: '#3d6b61' };
  const inactiveStyle = { backgroundColor: '#fcd5cf' };
  const activeTextColor = '#ffffff';
  const inactiveTextColor = '#c0392b';

  return (
    <HStack style={{ gap: 4 }}>
      <Pressable
        onPress={() => onChange('on')}
        style={[
          {
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 999,
          },
          value === 'on' ? activeStyle : inactiveStyle,
        ]}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: value === 'on' ? activeTextColor : inactiveTextColor }}
        >
          ON
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('off')}
        style={[
          {
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 999,
          },
          value === 'off' ? activeStyle : inactiveStyle,
        ]}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: value === 'off' ? activeTextColor : inactiveTextColor }}
        >
          OFF
        </Text>
      </Pressable>
    </HStack>
  );
}

export function ActivationSection() {
  const [aiState, setAiState] = useState<AiState>('on');

  return (
    <VStack testID="activation-section">
      <Text className="text-xl font-bold" style={{ marginBottom: 12 }}>
        Pause AI on all conversations
      </Text>

      <Box className="bg-white rounded-[32px] p-6">
        {/* Description */}
        <Text className="text-sm" style={{ color: '#444444', marginBottom: 20, lineHeight: 20 }}>
          If something is wrong or you just want to take back control for a moment, you can pause
          the AI for any restaurant below. While paused, the AI stops replying and your team
          answers manually. You can resume anytime.
        </Text>

        {/* Column header row */}
        <HStack className="justify-between items-center" style={{ marginBottom: 10 }}>
          <Text className="text-xs" style={{ color: '#888888' }}>
            Name
          </Text>
          <Text className="text-xs" style={{ color: '#888888' }}>
            Status
          </Text>
        </HStack>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#e5e5e5', marginBottom: 12 }} />

        {/* Data row */}
        <HStack className="justify-between items-center">
          <Text className="text-base font-bold">Le Restaurante</Text>
          <AiToggle value={aiState} onChange={setAiState} />
        </HStack>
      </Box>
    </VStack>
  );
}
