import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneInput } from '../components/PhoneInput';

interface PhoneScreenProps {
  onSubmit: (phone: string) => void;
  onGuestLogin: () => void;
}

export function PhoneScreen({ onSubmit, onGuestLogin }: PhoneScreenProps) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (phone.length < 10) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSubmit(phone);
    }, 1000);
  };

  const isValidPhone = phone.length >= 10;

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
          <View
            className="w-full h-48 rounded-2xl mb-8 items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Text className="text-gray-400 text-sm">Illustration Placeholder</Text>
          </View>

          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Masuk atau Daftar
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Kami akan mengirimkan kode verifikasi ke nomor HP Anda
          </Text>

          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Nomor Handphone
            </Text>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              onSubmit={handleContinue}
              disabled={isLoading}
            />
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValidPhone || isLoading}
            className={`rounded-xl py-4 items-center ${isValidPhone && !isLoading ? 'bg-black' : 'bg-gray-300'}`}
            activeOpacity={0.8}
          >
            <Text className={`text-base font-semibold ${isValidPhone && !isLoading ? 'text-white' : 'text-gray-500'}`}>
              {isLoading ? 'Mengirim...' : 'Lanjutkan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onGuestLogin}
            className="rounded-xl py-4 items-center bg-transparent border border-gray-300 mt-3"
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-gray-700">
              Masuk tanpa login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
