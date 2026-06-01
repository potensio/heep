import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { MapPointWave } from "@solar-icons/react-native/Bold";
import { CityPicker } from "./CityPicker";
import type { Location } from "@/lib/types";

interface CityInputFieldProps {
  label?: string;
  value: Location | null;
  onSelect: (location: Location) => void;
}

export function CityInputField({
  label,
  value,
  onSelect,
}: CityInputFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View>
      {label && (
        <Text className="text-sm text-gray-600 mb-2 font-medium">{label}</Text>
      )}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-white rounded-xl border-2 border-gray-900 flex-row items-center px-4"
        style={{ height: 52 }}
        activeOpacity={0.8}
      >
        <MapPointWave size={16} color={value ? "#155DFC" : "#111827"} />
        <Text
          className="flex-1 ml-2"
          style={{ fontSize: 18, color: value ? "#111827" : "#9CA3AF" }}
        >
          {value ? value.name : "Pilih kota..."}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <CityPicker
          value={value}
          onSelect={(loc) => {
            onSelect(loc);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </View>
  );
}
