import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Eye, EyeClosed } from "@solar-icons/react-native/Linear";

// Consistent input styling matching ProductInfoStep
const INPUT_HEIGHT = 50;
const INPUT_FONT_SIZE = 16;

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Semua field harus diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Konfirmasi password tidak cocok");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password baru minimal 8 karakter");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Sukses", "Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background p-5">
      <Text className="text-sm font-medium text-gray-700 mb-4">Ubah Password</Text>

      <View className="gap-4">
        {/* Current Password */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Password Saat Ini</Text>
          <View
            className="flex-row items-center border border-gray-300 rounded-xl bg-white overflow-hidden"
            style={{ height: INPUT_HEIGHT }}
          >
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Masukkan password saat ini"
              secureTextEntry={!showCurrentPassword}
              className="flex-1 px-4 text-gray-900"
              placeholderTextColor="#9CA3AF"
              style={{ fontSize: INPUT_FONT_SIZE }}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              className="px-3"
            >
              {showCurrentPassword ? (
                <Eye size={20} color="#9CA3AF" />
              ) : (
                <EyeClosed size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Password Baru</Text>
          <View
            className="flex-row items-center border border-gray-300 rounded-xl bg-white overflow-hidden"
            style={{ height: INPUT_HEIGHT }}
          >
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Masukkan password baru"
              secureTextEntry={!showNewPassword}
              className="flex-1 px-4 text-gray-900"
              placeholderTextColor="#9CA3AF"
              style={{ fontSize: INPUT_FONT_SIZE }}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              className="px-3"
            >
              {showNewPassword ? (
                <Eye size={20} color="#9CA3AF" />
              ) : (
                <EyeClosed size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</Text>
          <View
            className="flex-row items-center border border-gray-300 rounded-xl bg-white overflow-hidden"
            style={{ height: INPUT_HEIGHT }}
          >
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Konfirmasi password baru"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 px-4 text-gray-900"
              placeholderTextColor="#9CA3AF"
              style={{ fontSize: INPUT_FONT_SIZE }}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="px-3"
            >
              {showConfirmPassword ? (
                <Eye size={20} color="#9CA3AF" />
              ) : (
                <EyeClosed size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleChangePassword}
        disabled={isLoading}
        className={`mt-6 rounded-xl py-4 items-center ${isLoading ? "bg-gray-300" : "bg-black"}`}
      >
        <Text className={`text-base font-medium ${isLoading ? "text-gray-500" : "text-white"}`}>
          {isLoading ? "Menyimpan..." : "Ubah Password"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
