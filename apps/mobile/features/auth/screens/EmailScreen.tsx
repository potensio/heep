import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmailInput } from "../components/EmailInput";
import { Button } from "@/components/ui/Button";
import { requestOtp, ApiError } from "@/lib/api";

interface EmailScreenProps {
  onSubmit: (email: string) => void;
  onGuestLogin: () => void;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function EmailScreen({ onSubmit, onGuestLogin }: EmailScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!EMAIL_REGEX.test(email)) return;
    setIsLoading(true);
    setError(null);
    try {
      await requestOtp(email);
      onSubmit(email);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status < 500
          ? "Terjadi kesalahan. Coba lagi."
          : "Server error. Coba beberapa saat lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = EMAIL_REGEX.test(email);

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
          <View
            className="w-full h-48 rounded-2xl mb-8 items-center justify-center"
            style={{ backgroundColor: "#F3F4F6" }}
          >
            <Text className="text-gray-400 text-sm">
              Illustration Placeholder
            </Text>
          </View>

          <Text className="text-2xl font-heading font-medium text-gray-900 mb-2 text-center">
            Masuk atau Daftar
          </Text>
          <Text className="text-base text-gray-600 mb-8 text-center">
            Kami akan mengirimkan kode verifikasi ke email Anda
          </Text>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2 font-medium">
              Email
            </Text>
            <EmailInput
              value={email}
              onChangeText={setEmail}
              onSubmit={handleContinue}
              disabled={isLoading}
            />
            {error !== null && (
              <Text className="text-sm text-red-500 mt-2">{error}</Text>
            )}
          </View>

          <Button
            onPress={handleContinue}
            disabled={!isValidEmail}
            loading={isLoading}
            size="lg"
          >
            {isLoading ? "Mengirim..." : "Lanjutkan"}
          </Button>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-sm text-gray-400">atau</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <Button
            variant="outline"
            onPress={onGuestLogin}
            size="lg"
          >
            Masuk tanpa login
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
