import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { User } from "@solar-icons/react-native/Linear";

export function ProfileSettings() {
  const [name, setName] = useState("Andi Pratama");
  const [email, setEmail] = useState("andi.pratama@email.com");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Nama tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Sukses", "Profil berhasil diperbarui");
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background p-5">
      {/* Avatar Section */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
          <User size={40} className="text-gray-400" />
        </View>
        <TouchableOpacity className="mt-3">
          <Text className="text-sm font-medium text-blue-600">Ubah Foto</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View className="gap-4">
        <View>
          <Text className="text-sm text-gray-600 mb-1">Nama Lengkap</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Masukkan nama lengkap"
            className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View>
          <Text className="text-sm text-gray-600 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Masukkan email"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
            placeholderTextColor="#9CA3AF"
          />
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
    </View>
  );
}
