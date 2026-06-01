import { View, Text, TouchableOpacity, Alert, Image } from "react-native";
import { TextInputField } from "@/components/ui/TextInputField";
import { Button } from "@/components/ui/Button";
import { EmailInput } from "@/features/auth/components/EmailInput";
import { CityInputField } from "@/features/shared/components/CityInputField";
import { useAvatarSheet } from "@/features/auth/components/AvatarSheetContext";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import type { Location } from "@/lib/types";

export function ProfileSettings() {
  const { user, token, updateUser } = useAuth();
  const { openAvatarSheet } = useAvatarSheet();
  const [name, setName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Nama tidak boleh kosong");
      return;
    }
    if (!token) return;
    setIsLoading(true);
    try {
      const updatedUser = await updateProfile(token, {
        name: name.trim(),
        avatarUrl: avatarUrl ?? undefined,
      });
      updateUser({ ...updatedUser, location: user?.location ?? null });
      Alert.alert("Sukses", "Profil berhasil diperbarui");
    } catch {
      Alert.alert("Error", "Gagal menyimpan profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = (url: string) => {
    setAvatarUrl(url);
  };

  const handleLocationSelect = async (location: Location) => {
    if (!token) return;
    try {
      const updatedUser = await updateProfile(token, { location });
      updateUser({ ...updatedUser, location });
    } catch {
      // best-effort
    }
  };

  return (
    <View className="flex-1 bg-background p-5">
      {/* Avatar Section */}
      <View className="items-center mb-8">
        <TouchableOpacity
          onPress={() => openAvatarSheet(handleAvatarSelect, avatarUrl)}
          activeOpacity={0.8}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 2,
            borderColor: '#D1D5DB',
            overflow: 'hidden',
            backgroundColor: '#E5E7EB',
          }}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 96, height: 96 }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-400 text-sm">Pilih</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openAvatarSheet(handleAvatarSelect, avatarUrl)} className="mt-3">
          <Text className="text-sm font-medium text-blue-600">Ubah Avatar</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View className="gap-4">
        <TextInputField
          label="Nama Lengkap"
          value={name}
          onChangeText={setName}
          placeholder="Masukkan nama lengkap"
        />

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <EmailInput value={email} onChangeText={() => {}} disabled />
        </View>

        <CityInputField
          label="Kota"
          value={user?.location ?? null}
          onSelect={handleLocationSelect}
        />
      </View>

      {/* Save Button */}
      <Button
        onPress={handleSave}
        loading={isLoading}
        disabled={isLoading}
        variant="primary"
        size="lg"
        style={{ marginTop: 24 }}
      >
        Simpan
      </Button>
    </View>
  );
}
