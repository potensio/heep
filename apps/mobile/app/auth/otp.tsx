import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { OtpScreen } from '@/features/auth/screens/otp-screen';

export default function OtpRoute() {
  const router = useRouter();
  const { email, type } = useLocalSearchParams<{ email: string; type: 'login' | 'signup' }>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: { otp: string }) => {
    setIsLoading(true);
    // TODO: Call API here
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.replace('/auth');
  };

  const handleResend = () => {
    console.log('Resend OTP to:', email);
    // TODO: Implement resend logic
  };

  return (
    <OtpScreen
      email={email || ''}
      type={type || 'login'}
      onSubmit={handleSubmit}
      onResendOtp={handleResend}
      isLoading={isLoading}
    />
  );
}
