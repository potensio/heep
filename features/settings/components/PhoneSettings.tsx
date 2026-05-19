import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Phone } from "@solar-icons/react-native/Linear";

export function PhoneSettings() {
  const [phoneNumber] = useState("+62 812-3456-7890");

  const handleChangePhone = () => {
    Alert.alert(
      "Ubah Nomor",
      "Fitur verifikasi nomor handphone akan segera tersedia.",
      [{ text: "OK" }]
    );
  };

  return (
    <View className="flex-1 bg-background p-5">
      {/* Current Phone Display */}
      <View className="bg-white rounded-xl p-5 mb-4">
        <Text className="text-sm text-gray-600 mb-2">Nomor Handphone Saat Ini</Text>
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <Phone size={20} className="text-gray-600" />
          </View>
          <Text className="text-lg font-medium">{phoneNumber}</Text>
        </View>
      </View>

      {/* Change Button */}
      <TouchableOpacity
        onPress={handleChangePhone}
        className="bg-white rounded-xl py-4 items-center border border-gray-200"
      >
        <Text className="text-base font-medium text-gray-800">Ubah Nomor Handphone</Text>
      </TouchableOpacity>

      {/* Info */}
      <Text className="text-sm text-gray-500 mt-4 text-center">
        Nomor handphone digunakan untuk verifikasi dan pemulihan akun.
      </Text>
    </View>
  );
}
