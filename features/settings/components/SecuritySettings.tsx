import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { Eye, EyeClosed } from "@solar-icons/react-native/Linear";

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
      <Text className="text-sm text-gray-600 mb-4">Ubah Password</Text>

      <View className="gap-4">
        {/* Current Password */}
        <View>
          <Text className="text-xs text-gray-500 mb-1">Password Saat Ini</Text>
          <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Masukkan password saat ini"
              secureTextEntry={!showCurrentPassword}
              className="flex-1 px-4 py-3 text-base"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              className="px-3"
            >
              {showCurrentPassword ? (
                <Eye size={20} className="text-gray-400" />
              ) : (
                <EyeClosed size={20} className="text-gray-400" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View>
          <Text className="text-xs text-gray-500 mb-1">Password Baru</Text>
          <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Masukkan password baru"
              secureTextEntry={!showNewPassword}
              className="flex-1 px-4 py-3 text-base"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              className="px-3"
            >
              {showNewPassword ? (
                <Eye size={20} className="text-gray-400" />
              ) : (
                <EyeClosed size={20} className="text-gray-400" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View>
          <Text className="text-xs text-gray-500 mb-1">Konfirmasi Password Baru</Text>
          <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Konfirmasi password baru"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 px-4 py-3 text-base"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="px-3"
            >
              {showConfirmPassword ? (
                <Eye size={20} className="text-gray-400" />
              ) : (
                <EyeClosed size={20} className="text-gray-400" />
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
