import { useRef } from "react";
import { View, ScrollView } from "react-native";
import { Controller } from "react-hook-form";
import { PasswordInput } from "../components/password-input";
import { Input, InputField } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { AuthButton } from "../components/auth-button";
import { useAuthForm } from "../hooks/use-auth-form";
import { useKeyboardAwareScroll } from "../hooks/use-keyboard-aware-scroll";
import { signupSchema } from "../schemas/auth-schemas";
import type { SignupScreenProps } from "../types";

export function SignupScreen({
  onSubmit,
  onNavigateToLogin,
  isLoading,
  error,
}: SignupScreenProps) {
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useAuthForm(signupSchema);

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
          Create account
        </Text>

        <Text className="text-[16px] font-light text-white tracking-tight mb-8">
          Please enter your details to sign up
        </Text>

        <View className="flex flex-col p-8 bg-black/30 rounded-[30] h-fit">
          <View className="flex-row gap-3 mb-4">
            <Controller
              control={control}
              name="firstName"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <View className="flex-1">
                  <Text className="text-white text-[16px] font-light tracking-tighter mb-3">
                    First Name
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
                      placeholder="First"
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!isLoading}
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
              name="lastName"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <View className="flex-1">
                  <Text className="text-white text-[16px] font-light tracking-tighter mb-3">
                    Last Name
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
                      placeholder="Last"
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!isLoading}
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
          </View>

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

          {error && (
            <Text className="text-error-500 text-sm tracking-tighter mb-3">
              {error}
            </Text>
          )}

          <AuthButton
            label="Sign Up"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            isDisabled={!isValid || isLoading}
            style={{ marginTop: 4, marginBottom: 12 }}
          />

          <View className="flex-row items-center justify-start gap-0">
            <Text className="text-white text-sm leading-tight tracking-tighter mr-0.5">
              Already have an account?{" "}
            </Text>
            <Button variant="link" onPress={onNavigateToLogin}>
              <Text className="font-light text-white text-sm leading-tight tracking-tighter underline">
                Sign in
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
