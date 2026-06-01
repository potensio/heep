// features/auth/components/EmailInput.tsx
import { View, TextInput, Platform } from "react-native";
import { useState } from "react";
import { Letter } from "@solar-icons/react-native/Bold";

interface EmailInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function EmailInput({
  value,
  onChangeText,
  onSubmit,
  disabled,
}: EmailInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (EMAIL_REGEX.test(value) && onSubmit) {
      onSubmit();
    }
  };

  return (
    <View
      className={`
        rounded-xl border-2
        ${disabled ? "bg-gray-100 border-gray-200" : "bg-white"}
        ${isFocused && !disabled ? "border-primary" : ""}
        ${!isFocused && !disabled ? "border-neutral-900" : ""}
      `}
      style={{ height: 52, flexDirection: "row", alignItems: "center" }}
    >
      <View style={{ paddingLeft: 16 }}>
        <Letter size={20} color={disabled ? "#9CA3AF" : isFocused ? "#ED4304" : "#171717"} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={handleSubmit}
        placeholder="nama@email.com"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        style={{
          fontSize: 18,
          paddingHorizontal: 12,
          paddingRight: 16,
          flex: 1,
          height: "100%",
          color: disabled ? "#9CA3AF" : "#111827",
          ...(Platform.OS === "android"
            ? { includeFontPadding: false, textAlignVertical: "center" }
            : {}),
        }}
        returnKeyType="done"
      />
    </View>
  );
}
