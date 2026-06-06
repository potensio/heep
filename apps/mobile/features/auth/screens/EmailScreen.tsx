import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";

interface EmailScreenProps {
  onSubmit: (email: string) => void;
  onGuestLogin?: () => void;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function EmailScreen({ onSubmit, onGuestLogin }: EmailScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!EMAIL_REGEX.test(email)) return;
    setIsLoading(true);
    // TODO: Call API here
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    onSubmit(email);
  };

  const isValidEmail = EMAIL_REGEX.test(email);

  return (
    <Box className="flex-1 bg-background-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 40,
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Box className="w-full h-48 rounded-2xl mb-8 items-center justify-center bg-secondary-100">
            <Text className="text-typography-400 text-sm">Illustration</Text>
          </Box>

          <Text className="text-2xl font-heading text-typography-900 mb-2 text-center">
            Masuk atau Daftar
          </Text>
          <Text className="text-base text-typography-600 mb-8 text-center">
            Masukkan email untuk melanjutkan
          </Text>

          <VStack space="4" className="mb-4">
            <Text className="text-sm text-typography-600 font-medium">
              Email
            </Text>
            <Input variant="outline" size="lg">
              <InputField
                value={email}
                onChangeText={setEmail}
                placeholder="nama@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleContinue}
                editable={!isLoading}
              />
            </Input>
          </VStack>

          <Button
            size="lg"
            onPress={handleContinue}
            isDisabled={!isValidEmail}
          >
            <ButtonText>
              {isLoading ? "Memproses..." : "Lanjutkan"}
            </ButtonText>
          </Button>

          {onGuestLogin && (
            <>
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-outline-200" />
                <Text className="mx-4 text-sm text-typography-500">atau</Text>
                <View className="flex-1 h-px bg-outline-200" />
              </View>

              <Button variant="outline" size="lg" onPress={onGuestLogin}>
                <ButtonText className="text-primary-500">Lewati</ButtonText>
              </Button>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
