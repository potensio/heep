// features/auth/components/EmailInput.tsx
import { View, TextInput, Platform } from 'react-native';
import { useState } from 'react';

interface EmailInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function EmailInput({ value, onChangeText, onSubmit, disabled }: EmailInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (EMAIL_REGEX.test(value) && onSubmit) {
      onSubmit();
    }
  };

  return (
    <View
      className={`
        bg-white rounded-xl border
        ${isFocused ? 'border-primary' : 'border-gray-200'}
      `}
      style={{ height: 52, justifyContent: 'center' }}
    >
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
          fontSize: 16,
          paddingHorizontal: 16,
          height: '100%',
          ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {}),
        }}
        returnKeyType="done"
      />
    </View>
  );
}
