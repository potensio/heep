import { View, TextInput, TouchableOpacity } from "react-native";
import { Magnifer, CloseSquare } from "@solar-icons/react-native/Linear";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

const INPUT_HEIGHT = 50;
const INPUT_FONT_SIZE = 16;

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Cari produk yang kamu inginkan...",
}: SearchBarProps) {
  return (
    <View
      className="flex-row items-center border border-gray-300 rounded-xl bg-white px-4 overflow-hidden"
      style={{ height: INPUT_HEIGHT }}
    >
      <Magnifer size={20} color="#666666" />
      <TextInput
        className="flex-1 ml-3 text-gray-900"
        style={{ fontSize: INPUT_FONT_SIZE, height: INPUT_HEIGHT }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} className="p-1">
          <CloseSquare size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
