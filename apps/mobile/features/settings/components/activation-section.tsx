import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Box } from '@/components/ui/box';

export function ActivationSection() {
  return (
    <Box testID="activation-section" className="bg-white rounded-[32px] p-6 mt-6">
      <Text className="text-xl font-semibold" style={{ marginBottom: 16 }}>
        Activation
      </Text>
      <VStack className="items-center" style={{ marginTop: 16 }}>
        <Text className="text-sm" style={{ opacity: 0.5 }}>
          Coming soon
        </Text>
      </VStack>
    </Box>
  );
}
