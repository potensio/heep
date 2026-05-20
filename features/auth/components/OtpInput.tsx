import { View, TextInput } from 'react-native';
import { createRef } from 'react';

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({ value, onChangeText, length = 6, disabled }: OtpInputProps) {
  const inputRefs = Array.from({ length }, () => createRef<TextInput>());

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    
    if (digit.length > 1) {
      // Handle paste - take only the relevant digits
      const newOtp = digit.slice(0, length);
      onChangeText(newOtp);
      // Focus the last filled box or the next empty one
      const nextIndex = Math.min(newOtp.length, length - 1);
      inputRefs[nextIndex]?.current?.focus();
      return;
    }

    // Single digit input
    const currentValue = value || '';
    const newOtp = currentValue.split('');
    newOtp[index] = digit;
    const result = newOtp.join('').slice(0, length);
    onChangeText(result);

    // Move to next input if there's a digit
    if (digit && index < length - 1) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      const currentValue = value || '';
      
      // If current box is empty and it's not the first box, move back and clear
      if (!currentValue[index] && index > 0) {
        const newOtp = currentValue.split('');
        newOtp[index - 1] = '';
        onChangeText(newOtp.join(''));
        inputRefs[index - 1]?.current?.focus();
      } else {
        // Clear current box
        const newOtp = currentValue.split('');
        newOtp[index] = '';
        onChangeText(newOtp.join(''));
      }
    }
  };

  return (
    <View className="flex-row justify-center gap-2">
      {Array.from({ length }).map((_, index) => {
        const currentValue = value || '';
        const digit = currentValue[index] || '';
        const isFilled = digit.length === 1;

        return (
          <View
            key={index}
            className={`
              w-12 h-14 rounded-xl items-center justify-center
              ${isFilled ? 'bg-primary-50 border-primary' : 'bg-white border-gray-200'}
              border
            `}
          >
            <TextInput
              ref={inputRefs[index]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!disabled}
              selectTextOnFocus
              className="text-xl font-semibold text-center"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        );
      })}
    </View>
  );
}
