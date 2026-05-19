import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Shop } from "@solar-icons/react-native/Linear";

export function ShopSettings() {
  const [shopName, setShopName] = useState("Toko Andi Official");
  const [description, setDescription] = useState("Menjual produk fashion original dan berkualitas");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert("Error", "Nama toko tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Sukses", "Pengaturan toko berhasil disimpan");
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background p-5">
      {/* Shop Logo/Avatar */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
          <Shop size={40} className="text-gray-400" />
        </View>
        <TouchableOpacity className="mt-3">
          <Text className="text-sm font-medium text-blue-600">Ubah Logo</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View className="gap-4">
        <View>
          <Text className="text-sm text-gray-600 mb-1">Nama Toko</Text>
          <TextInput
            value={shopName}
            onChangeText={setShopName}
            placeholder="Masukkan nama toko"
            className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View>
          <Text className="text-sm text-gray-600 mb-1">Deskripsi</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ceritakan tentang toko Anda"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-white rounded-xl px-4 py-3 text-base border border-gray-200 min-h-[100px]"
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
