import { View } from 'react-native';
import { Controller } from 'react-hook-form';
import { AuthLayout } from '../components/auth-layout';
import { PasswordInput } from '../components/password-input';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthForm } from '../hooks/use-auth-form';
import { useAuthTranslation } from '../i18n';
import { loginSchema } from '../schemas/auth-schemas';
import type { LoginScreenProps } from '../types';

export function LoginScreen({ onSubmit, onNavigateToSignup, isLoading }: LoginScreenProps) {
  const { t } = useAuthTranslation();
  const { control, handleSubmit, formState: { isValid } } = useAuthForm(loginSchema);

  return (
    <AuthLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <VStack space="1">
            <Text className="text-sm text-typography-600 font-medium">
              {t('login.emailLabel')}
            </Text>
            <Input variant="outline" size="lg">
              <InputField
                value={value}
                onChangeText={onChange}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </Input>
            {error && (
              <Text className="text-error-500 text-sm">{error.message}</Text>
            )}
          </VStack>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <VStack space="1">
            <Text className="text-sm text-typography-600 font-medium">
              {t('login.passwordLabel')}
            </Text>
            <PasswordInput
              value={value}
              onChangeText={onChange}
              error={error?.message}
              isDisabled={isLoading}
            />
          </VStack>
        )}
      />

      <Button
        size="lg"
        onPress={handleSubmit(onSubmit)}
        isDisabled={!isValid || isLoading}
        className="mt-4"
      >
        <ButtonText>
          {isLoading ? 'Loading...' : t('login.submitButton')}
        </ButtonText>
      </Button>

      <View className="flex-row items-center justify-center mt-6">
        <Text className="text-sm text-typography-500">
          {t('login.noAccount')}{' '}
        </Text>
        <Text
          className="text-sm text-primary-500 font-medium"
          onPress={onNavigateToSignup}
        >
          {t('login.signUpLink')}
        </Text>
      </View>
    </AuthLayout>
  );
}
