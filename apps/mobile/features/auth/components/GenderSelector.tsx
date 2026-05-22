// features/auth/components/GenderSelector.tsx
import { View, Text, TouchableOpacity } from 'react-native';

type Gender = 'pria' | 'wanita' | null;

interface GenderSelectorProps {
  value: Gender;
  onChange: (gender: Gender) => void;
}

export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  return (
    <View className="flex-row gap-3">
      <TouchableOpacity
        onPress={() => onChange('pria')}
        className={`
          flex-1 py-3.5 rounded-xl border items-center
          ${value === 'pria' ? 'bg-black border-black' : 'bg-white border-gray-200'}
        `}
        activeOpacity={0.8}
      >
        <Text
          className={`
            text-base font-medium
            ${value === 'pria' ? 'text-white' : 'text-gray-700'}
          `}
        >
          Pria
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange('wanita')}
        className={`
          flex-1 py-3.5 rounded-xl border items-center
          ${value === 'wanita' ? 'bg-black border-black' : 'bg-white border-gray-200'}
        `}
        activeOpacity={0.8}
      >
        <Text
          className={`
            text-base font-medium
            ${value === 'wanita' ? 'text-white' : 'text-gray-700'}
          `}
        >
          Wanita
        </Text>
      </TouchableOpacity>
    </View>
  );
}
