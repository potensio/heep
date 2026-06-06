import { View } from 'react-native';
import { Controller } from 'react-hook-form';
import { AuthLayout } from '../components/auth-layout';
import { OtpInput } from '../components/otp-input';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuthForm } from '../hooks/use-auth-form';
import { useAuthTranslation } from '../i18n';
import { otpSchema } from '../schemas/auth-schemas';
import type { OtpScreenProps } from '../types';

export function OtpScreen({ email, type, onSubmit, onResendOtp, isLoading }: OtpScreenProps) {
  const { t } = useAuthTranslation();
  const { control, handleSubmit, formState: { isValid } } = useAuthForm(otpSchema);

  return (
    <AuthLayout
      title={t('otp.title')}
      subtitle={t('otp.subtitle', { email })}
    >
      <Controller
        control={control}
        name="otp"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <OtpInput
            value={value}
            onChangeText={onChange}
            error={error?.message}
            isDisabled={isLoading}
          />
        )}
      />

      <Button
        size="lg"
        onPress={handleSubmit(onSubmit)}
        isDisabled={!isValid || isLoading}
        className="mt-8"
      >
        <ButtonText>
          {isLoading ? 'Verifying...' : t('otp.verifyButton')}
        </ButtonText>
      </Button>

      <View className="flex-row items-center justify-center mt-6">
        <Text className="text-sm text-typography-500">
          Didn't receive the code?{' '}
        </Text>
        <Text
          className="text-sm text-primary-500 font-medium"
          onPress={onResendOtp}
        >
          {t('otp.resend')}
        </Text>
      </View>
    </AuthLayout>
  );
}
