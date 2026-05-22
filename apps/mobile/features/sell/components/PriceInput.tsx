// features/sell/components/PriceInput.tsx
import { View, TextInput, Text } from 'react-native';
import { useState, useEffect } from 'react';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  error?: string;
}

function formatRupiah(value: number): string {
  if (!value || value === 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseRupiah(value: string): number {
  const numeric = value.replace(/[^\d]/g, '');
  return parseInt(numeric, 10) || 0;
}

export function PriceInput({ value, onChange, placeholder = '0', error }: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(formatRupiah(value));

  useEffect(() => {
    setDisplayValue(formatRupiah(value));
  }, [value]);

  const handleChange = (text: string) => {
    const numeric = text.replace(/[^\d]/g, '');
    const numberValue = parseInt(numeric, 10) || 0;
    setDisplayValue(formatRupiah(numberValue));
    onChange(numberValue);
  };

  return (
    <View>
      <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-white">
        <Text className="text-gray-700 font-medium mr-2">Rp</Text>
        <TextInput
          className="flex-1 text-gray-900 text-base"
          value={displayValue}
          onChangeText={handleChange}
          placeholder={placeholder}
          keyboardType="number-pad"
          maxLength={15}
        />
      </View>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
