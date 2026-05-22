// features/auth/components/PhoneInput.tsx
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
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
          flex-row items-center bg-white rounded-xl border
          ${isFocused ? 'border-primary' : 'border-gray-200'}
        `}
        style={{ flex: 1 }}
      >
        <TouchableOpacity className="px-4 py-4 border-r border-gray-200">
          <Text className="text-base text-gray-800 font-medium">+62</Text>
        </TouchableOpacity>
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
          className="flex-1 px-4 py-4 text-base"
          returnKeyType="done"
        />
      </View>
    </View>
  );
}
