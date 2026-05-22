// features/auth/components/PhoneInput.tsx
import { View, Text, TextInput, Platform } from 'react-native';
import { useState } from 'react';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function PhoneInput({ value, onChangeText, onSubmit, disabled }: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (value.length >= 10 && onSubmit) {
      onSubmit();
    }
  };

  return (
    <View className="flex-row items-center">
      <View
        className={`
          flex-row bg-white rounded-xl border
          ${isFocused ? 'border-primary' : 'border-gray-200'}
        `}
        style={{ flex: 1, height: 52, alignItems: 'center' }}
      >
        <View
          className="border-r border-gray-200"
          style={{ paddingHorizontal: 16, height: '100%', justifyContent: 'center' }}
        >
          <Text
            className="text-base text-gray-800 font-medium"
            style={Platform.OS === 'android' ? { includeFontPadding: false } : undefined}
          >
            +62
          </Text>
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          placeholder="812 3456 7890"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={13}
          editable={!disabled}
          style={{
            flex: 1,
            fontSize: 16,
            paddingHorizontal: 16,
            height: '100%',
            ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {}),
          }}
          returnKeyType="done"
        />
      </View>
    </View>
  );
}
