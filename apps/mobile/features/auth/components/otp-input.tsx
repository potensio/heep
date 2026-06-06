import { useRef } from 'react';
import { TextInput } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  error?: string;
  isDisabled?: boolean;
}

export function OtpInput({
  value,
  onChangeText,
  length = 6,
  error,
  isDisabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const newValue = value.split('');
    newValue[index] = numericText.slice(-1);
    const updatedValue = newValue.join('');
    onChangeText(updatedValue);

    if (numericText && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(numericText);
    inputRefs.current[numericText.length - 1]?.focus();
  };

  return (
    <>
      <HStack space="2" className="justify-center">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            variant="outline"
            size="lg"
            className="w-12 h-12"
          >
            <InputField
              ref={(ref) => { inputRefs.current[index] = ref; }}
              value={value[index] || ''}
              onChangeText={(text) => {
                if (text.length > 1) {
                  handlePaste(text);
                } else {
                  handleChange(text, index);
                }
              }}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              editable={!isDisabled}
            />
          </Input>
        ))}
      </HStack>
      {error && <Text className="text-error-500 text-sm mt-2 text-center">{error}</Text>}
    </>
  );
}
