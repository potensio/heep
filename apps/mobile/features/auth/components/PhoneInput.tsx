// features/auth/components/PhoneInput.tsx
import { View, TextInput, Text, Platform } from "react-native";
import { useState } from "react";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  error?: string;
}

// Input: 812345678 (tanpa leading 0, karena UI sudah ada prefix +62)
// Display: 812-3456-78
function formatPhoneNumber(text: string): string {
  const digits = text.replace(/\D/g, "");
  const limited = digits.slice(0, 11); // max 11 digit setelah +62

  if (limited.length <= 3) return limited;
  if (limited.length <= 7) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
}

function isValidIndonesianPhone(text: string): boolean {
  const digits = text.replace(/\D/g, "");
  return /^8\d{8,10}$/.test(digits); // 9-11 digit tanpa leading 0
}

export function PhoneInput({
  value,
  onChangeText,
  onSubmit,
  disabled,
  error,
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    let digits = text.replace(/\D/g, "");
    // Handle paste dengan country code atau leading zero
    if (digits.startsWith("62")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    onChangeText(digits);
  };

  const handleSubmit = () => {
    if (isValidIndonesianPhone(value) && onSubmit) {
      onSubmit();
    }
  };

  const displayValue = formatPhoneNumber(value);
  const hasError =
    error || (value.length > 0 && !isValidIndonesianPhone(value) && !isFocused);

  return (
    <View>
      <View
        className={`
          bg-white rounded-xl border-2 flex-row items-center
          ${hasError ? "border-red-500" : isFocused ? "border-primary" : "border-gray-900"}
        `}
        style={{ height: 52 }}
      >
        <View className="pl-4 pr-2">
          <Text className="text-lg text-gray-700 font-medium">🇮🇩 +62</Text>
        </View>
        <TextInput
          value={displayValue}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          placeholder="812-3456-789"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          editable={!disabled}
          style={{
            flex: 1,
            fontSize: 18,
            paddingHorizontal: 8,
            height: "100%",
            ...(Platform.OS === "android"
              ? { includeFontPadding: false, textAlignVertical: "center" }
              : {}),
          }}
          returnKeyType="done"
          maxLength={13} // xxx-xxxx-xxxx format (11 digit + 2 dash)
        />
      </View>
      {hasError && !isFocused && (
        <Text className="text-xs text-red-500 mt-1 ml-1">
          {error || "Format nomor tidak valid (contoh: 8123456789)"}
        </Text>
      )}
    </View>
  );
}

export { isValidIndonesianPhone };
