import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GenderSelector } from '../components/GenderSelector';
import { updateProfile, ApiError, type VerifiedUser } from '@/lib/api';

type LocalGender = 'pria' | 'wanita' | null;

interface CompleteProfileScreenProps {
  email: string;
  token: string;
  onSubmit: (user: VerifiedUser) => void;
}

export function CompleteProfileScreen({ email, token, onSubmit }: CompleteProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<LocalGender>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !gender) return;
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await updateProfile(token, {
        name: name.trim(),
        gender: gender === 'pria' ? 'male' : 'female',
        phone: phone.trim(),
      });
      onSubmit(updatedUser);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status < 500
          ? 'Terjadi kesalahan. Periksa data Anda.'
          : 'Server error. Coba beberapa saat lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = name.trim().length > 0 && phone.trim().length > 0 && gender !== null;

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
          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Lengkapi Profil
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Berikan informasi untuk melanjutkan
          </Text>

          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Nama Lengkap</Text>
            <View className="bg-white rounded-xl border border-gray-200" style={{ height: 52 }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#9CA3AF"
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: 16,
                  paddingHorizontal: 16,
                  ...(Platform.OS === 'android'
                    ? { includeFontPadding: false, textAlignVertical: 'center' }
                    : {}),
                }}
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Nomor Handphone</Text>
            <View className="bg-white rounded-xl border border-gray-200" style={{ height: 52 }}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Contoh: 08123456789"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: 16,
                  paddingHorizontal: 16,
                  ...(Platform.OS === 'android'
                    ? { includeFontPadding: false, textAlignVertical: 'center' }
                    : {}),
                }}
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-sm text-gray-600 mb-2 font-medium">Jenis Kelamin</Text>
            <GenderSelector value={gender} onChange={setGender} />
          </View>

          {error !== null && (
            <Text className="text-sm text-red-500 mb-4">{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            className={`rounded-xl py-4 items-center ${isValid && !isLoading ? 'bg-black' : 'bg-gray-300'}`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-base font-semibold ${isValid && !isLoading ? 'text-white' : 'text-gray-500'}`}
            >
              {isLoading ? 'Menyimpan...' : 'Selesai'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
