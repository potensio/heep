import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { OtpInput } from '../components/OtpInput';
import { requestOtp, verifyOtp, ApiError, type VerifiedUser } from '@/lib/api';

interface OtpScreenProps {
  email: string;
  onSuccess: (user: VerifiedUser, token: string) => void;
  onBack: () => void;
}

export function OtpScreen({ email, onSuccess, onBack }: OtpScreenProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

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
    setError(null);
    try {
      const { accessToken, user } = await verifyOtp(email, otp);
      onSuccess(user, accessToken);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? 'Kode salah atau sudah kadaluarsa.'
          : 'Terjadi kesalahan. Coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    setError(null);
    try {
      await requestOtp(email);
    } catch {
      setError('Gagal mengirim ulang kode. Coba lagi.');
    }
  };

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
          <TouchableOpacity
            onPress={onBack}
            className="mb-6 w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </TouchableOpacity>

          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Verifikasi Email
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Masukkan kode 6 digit yang dikirim ke {email}
          </Text>

          <View className="mb-4">
            <OtpInput value={otp} onChangeText={setOtp} disabled={isLoading} />
            {error !== null && (
              <Text className="text-sm text-red-500 mt-2 text-center">{error}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isComplete || isLoading}
            className={`rounded-xl py-4 items-center mb-4 ${isComplete && !isLoading ? 'bg-black' : 'bg-gray-300'}`}
            activeOpacity={0.8}
          >
            <Text className={`text-base font-semibold ${isComplete && !isLoading ? 'text-white' : 'text-gray-500'}`}>
              {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-gray-600">Tidak menerima kode? </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text className="text-sm font-semibold text-primary">Kirim ulang kode</Text>
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
