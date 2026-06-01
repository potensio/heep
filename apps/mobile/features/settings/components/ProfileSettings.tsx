import { View, Text, TextInput, TouchableOpacity, Alert, Image } from "react-native";
import { useState } from "react";
import { MapPoint } from "@solar-icons/react-native/Linear";
import { CityPicker } from "@/features/shared/components/CityPicker";
import { AvatarSelector, AVATARS } from "@/features/auth/components/AvatarSelector";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import type { Location } from "@/lib/types";

const INPUT_HEIGHT = 50;
const INPUT_FONT_SIZE = 16;

export function ProfileSettings() {
  const { user, token, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
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
    setShowAvatarPicker(false);
  };

  const handleLocationSelect = async (location: Location) => {
    setShowCityPicker(false);
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
          onPress={() => setShowAvatarPicker(true)}
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
        <TouchableOpacity onPress={() => setShowAvatarPicker(true)} className="mt-3">
          <Text className="text-sm font-medium text-blue-600">Ubah Avatar</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View className="gap-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Nama Lengkap</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Masukkan nama lengkap"
            className="border border-gray-300 rounded-xl bg-white px-4 text-gray-900"
            placeholderTextColor="#9CA3AF"
            style={{ height: INPUT_HEIGHT, fontSize: INPUT_FONT_SIZE }}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <TextInput
            value={email}
            editable={false}
            className="border border-gray-200 rounded-xl bg-gray-50 px-4 text-gray-400"
            placeholderTextColor="#9CA3AF"
            style={{ height: INPUT_HEIGHT, fontSize: INPUT_FONT_SIZE }}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Kota</Text>
          <TouchableOpacity
            onPress={() => setShowCityPicker(true)}
            className="border border-gray-300 rounded-xl bg-white px-4 flex-row items-center"
            style={{ height: INPUT_HEIGHT }}
            activeOpacity={0.8}
          >
            <MapPoint size={16} color={user?.location ? '#155DFC' : '#9CA3AF'} />
            <Text
              className="flex-1 ml-2"
              style={{
                fontSize: INPUT_FONT_SIZE,
                color: user?.location ? '#111827' : '#9CA3AF',
              }}
            >
              {user?.location ? user.location.name : 'Belum diatur'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isLoading}
        className={`mt-6 rounded-xl py-4 items-center ${isLoading ? "bg-gray-300" : "bg-black"}`}
      >
        <Text className={`text-base font-medium ${isLoading ? "text-gray-500" : "text-white"}`}>
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Text>
      </TouchableOpacity>

      {showCityPicker && (
        <CityPicker
          value={user?.location ?? null}
          onSelect={handleLocationSelect}
          onClose={() => setShowCityPicker(false)}
        />
      )}

      {showAvatarPicker && (
        <TouchableOpacity
          onPress={() => setShowAvatarPicker(false)}
          activeOpacity={1}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-2xl p-6 mx-5">
              <Text className="text-lg font-semibold text-gray-900 text-center mb-4">Pilih Avatar</Text>
              <AvatarSelector value={avatarUrl} onChange={handleAvatarSelect} />
              <TouchableOpacity
                onPress={() => setShowAvatarPicker(false)}
                className="mt-4 py-3 rounded-xl bg-gray-100"
              >
                <Text className="text-center text-gray-600 font-medium">Batal</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}
