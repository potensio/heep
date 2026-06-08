import { useRef } from "react";
import { View, ScrollView } from "react-native";
import { Controller } from "react-hook-form";
import { PasswordInput } from "../components/password-input";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { AuthButton } from "../components/auth-button";
import { useAuthForm } from "../hooks/use-auth-form";
import { useKeyboardAwareScroll } from "../hooks/use-keyboard-aware-scroll";
import { loginSchema } from "../schemas/auth-schemas";
import type { LoginScreenProps } from "../types";

export function LoginScreen({
  onSubmit,
  onNavigateToSignup,
  isLoading,
  error,
}: LoginScreenProps) {
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useAuthForm(loginSchema);

  const { scrollRef, keyboardHeight, scrollToInput } = useKeyboardAwareScroll();
  const emailContainerRef = useRef<View>(null);
  const passwordContainerRef = useRef<View>(null);

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingBottom: keyboardHeight,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >
      <View className="max-w-md mx-auto w-full py-12">
        <Text className="text-[28px] font-medium text-white tracking-[-1] mt-5 mb-5">
          Heep.ai
        </Text>

        <Text className="text-[46px] text-white font-medium tracking-[-4] mb-4">
          Welcome back
        </Text>

        <Text className="text-[16px] font-light text-white tracking-tight mb-8">
          Please enter your details to sign in
        </Text>

        <View className="flex flex-col p-8 bg-black/30 rounded-[30] h-fit">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View ref={emailContainerRef} className="mb-4">
                <Text className="text-white text-[16px] font-light tracking-tighter mb-3">
                  Email Address
                </Text>
                <Input
                  variant="outline"
                  size="lg"
                  isInvalid={!!error}
                  className="bg-white"
                >
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    editable={!isLoading}
                    onFocus={() => scrollToInput(emailContainerRef)}
                  />
                </Input>
                {error && (
                  <Text className="text-error-500 text-sm tracking-tighter mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View ref={passwordContainerRef} className="mb-3">
                <Text className="text-white text-[16px] font-light tracking-tighter mb-3">
                  Password
                </Text>
                <PasswordInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="• • • • • • • • • • • • "
                  error={error?.message}
                  isDisabled={isLoading}
                  onFocus={() => scrollToInput(passwordContainerRef)}
                />
              </View>
            )}
          />

          <Button variant="link" className="self-start mb-4" onPress={() => {}}>
            <Text className="font-light text-white text-[16px] underline">
              Forgot Password?
            </Text>
          </Button>

          {error && (
            <Text className="text-error-500 text-sm tracking-tighter mb-3">
              {error}
            </Text>
          )}

          <AuthButton
            label="Sign In"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            isDisabled={!isValid || isLoading}
            style={{ marginTop: 4, marginBottom: 12 }}
          />

          <View className="flex-row items-center justify-start gap-0">
            <Text className="text-white text-sm leading-tight tracking-tighter mr-0.5">
              Don&apos;t have an account yet?{" "}
            </Text>
            <Button variant="link" onPress={onNavigateToSignup}>
              <Text className="font-light text-white text-sm leading-tight tracking-tighter underline">
                Sign up
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
