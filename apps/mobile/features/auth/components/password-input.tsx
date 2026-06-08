import { useState } from "react";
import { Pressable } from "react-native";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { EyeLinear, EyeClosedLinear } from "@solar-icons/react-native";
import { Text } from "@/components/ui/text";

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  isDisabled?: boolean;
  onFocus?: () => void;
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = "••••••••",
  error,
  isDisabled = false,
  onFocus,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <Input variant="outline" size="lg" className="relative bg-white">
        <InputField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isDisabled}
          onFocus={onFocus}
        />
        <InputSlot>
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <InputIcon as={EyeClosedLinear} className="text-muted" />
            ) : (
              <InputIcon as={EyeLinear} className="text-muted" />
            )}
          </Pressable>
        </InputSlot>
      </Input>
      {error && <Text className="text-error-500 text-sm mt-1">{error}</Text>}
    </>
  );
}
