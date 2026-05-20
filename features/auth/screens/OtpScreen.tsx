import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { OtpInput } from '../components/OtpInput';

export function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string }>();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    // Simulate API verification
    setTimeout(() => {
      setIsLoading(false);
      // For static demo, assume new user - navigate to complete profile
      router.replace('/auth/complete-profile');
    }, 1000);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    // Simulate resend
  };

  // Mask phone number for display
  const maskedPhone = params.phone 
    ? `+62 ${params.phone.slice(0, 3)}****${params.phone.slice(-3)}`
    : '';

  const isComplete = otp.length === 6;

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-6 w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Verifikasi Nomor HP
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Masukkan kode 6 digit yang dikirim ke {maskedPhone}
          </Text>

          {/* OTP Input */}
          <View className="mb-8">
            <OtpInput value={otp} onChangeText={setOtp} disabled={isLoading} />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isComplete || isLoading}
            className={`
              rounded-xl py-4 items-center mb-4
              ${isComplete && !isLoading ? 'bg-black' : 'bg-gray-300'}
            `}
            activeOpacity={0.8}
          >
            <Text
              className={`
                text-base font-semibold
                ${isComplete && !isLoading ? 'text-white' : 'text-gray-500'}
              `}
            >
              {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
            </Text>
          </TouchableOpacity>

          {/* Resend Code */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-gray-600">
              Tidak menerima kode?{' '}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text className="text-sm font-semibold text-primary">
                  Kirim ulang kode
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-sm font-semibold text-gray-400">
                Kirim ulang dalam {countdown}s
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
