// features/auth/screens/CompleteProfileScreen.tsx
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GenderSelector } from '../components/GenderSelector';

type Gender = 'pria' | 'wanita' | null;

export function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !gender) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/auth/success');
    }, 1000);
  };

  const isValid = name.trim().length > 0 && email.trim().length > 0 && gender !== null;

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
          {/* Title */}
          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
            Lengkapi Profil
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Berikan informasi untuk melanjutkan
          </Text>

          {/* Name Input */}
          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Nama Lengkap
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl px-4 py-4 text-base border border-gray-200"
            />
          </View>

          {/* Email Input */}
          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Masukkan email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-white rounded-xl px-4 py-4 text-base border border-gray-200"
            />
          </View>

          {/* Gender Selector */}
          <View className="mb-8">
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Jenis Kelamin
            </Text>
            <GenderSelector value={gender} onChange={setGender} />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            className={`
              rounded-xl py-4 items-center
              ${isValid && !isLoading ? 'bg-black' : 'bg-gray-300'}
            `}
            activeOpacity={0.8}
          >
            <Text
              className={`
                text-base font-semibold
                ${isValid && !isLoading ? 'text-white' : 'text-gray-500'}
              `}
            >
              {isLoading ? 'Menyimpan...' : 'Selesai'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
