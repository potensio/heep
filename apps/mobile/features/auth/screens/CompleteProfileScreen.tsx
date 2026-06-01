import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInputField } from "@/components/ui/TextInputField";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarSelector, AVATARS } from "../components/AvatarSheetContext";
import { PhoneInput, isValidIndonesianPhone } from "../components/PhoneInput";
import { CityInputField } from "@/features/shared/components/CityInputField";
import { updateProfile, ApiError, type VerifiedUser } from "@/lib/api";
import type { Location } from "@/lib/types";

function getGenderFromAvatarUrl(url: string): "male" | "female" {
  if (url.includes("avatar-male-")) return "male";
  return "female";
}

interface CompleteProfileScreenProps {
  email: string;
  token: string;
  onSubmit: (user: VerifiedUser) => void;
}

export function CompleteProfileScreen({
  email,
  token,
  onSubmit,
}: CompleteProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !avatarUrl || !location) return;
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await updateProfile(token, {
        name: name.trim(),
        gender: getGenderFromAvatarUrl(avatarUrl!),
        avatarUrl,
        phone: phone.trim(),
        location,
      });
      onSubmit({ ...updatedUser, location });
    } catch (e) {
      setError(
        e instanceof ApiError && e.status < 500
          ? "Terjadi kesalahan. Periksa data Anda."
          : "Server error. Coba beberapa saat lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    name.trim().length > 0 &&
    isValidIndonesianPhone(phone) &&
    avatarUrl !== null &&
    location !== null;

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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

          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-3 font-medium text-center">
              Pilih Avatar
            </Text>
            <AvatarSelector value={avatarUrl} onChange={setAvatarUrl} />
          </View>

          <View className="mb-5">
            <TextInputField
              label="Nama Lengkap"
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama lengkap"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Nomor Handphone
            </Text>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              disabled={isLoading}
            />
          </View>

          <View className="mb-5">
            <CityInputField
              label="Kota"
              value={location}
              onSelect={setLocation}
            />
          </View>

          {error !== null && (
            <Text className="text-sm text-red-500 mb-4">{error}</Text>
          )}

          <Button
            onPress={handleSubmit}
            disabled={!isValid}
            loading={isLoading}
            size="lg"
          >
            {isLoading ? "Menyimpan..." : "Selesai"}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

    </View>
  );
}
