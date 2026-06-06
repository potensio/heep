import { ReactNode } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';

interface AuthLayoutProps {
  illustration?: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ illustration, title, subtitle, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box className="flex-1 bg-background-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 40,
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {illustration && (
            <Box className="w-full h-48 rounded-2xl mb-8 items-center justify-center bg-secondary-100">
              {illustration}
            </Box>
          )}

          <Text className="text-2xl font-heading text-typography-900 mb-2 text-center">
            {title}
          </Text>

          {subtitle && (
            <Text className="text-base text-typography-600 mb-8 text-center">
              {subtitle}
            </Text>
          )}

          <VStack space="4" className="flex-1">
            {children}
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
