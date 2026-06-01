import { View, Text, TextInput, Platform, TextInputProps } from "react-native";
import { useState } from "react";

interface TextInputFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
}

export function TextInputField({ label, ...props }: TextInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      {label && (
        <Text className="text-sm text-gray-600 mb-2 font-medium">{label}</Text>
      )}
      <View
        className={`bg-white rounded-xl border-2 ${isFocused ? "border-primary" : "border-neutral-900"}`}
        style={{ height: 52 }}
      >
        <TextInput
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9CA3AF"
          {...props}
          style={{
            width: "100%",
            height: "100%",
            fontSize: 18,
            paddingHorizontal: 16,
            ...(Platform.OS === "android"
              ? { includeFontPadding: false, textAlignVertical: "center" }
              : {}),
          }}
        />
      </View>
    </View>
  );
}
