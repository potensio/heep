import { View, Text, TouchableOpacity } from "react-native";
import { Magnifer, Magnifer as SearchIcon } from "@solar-icons/react-native/Linear";

interface EmptyStateProps {
  query: string;
  suggestions: string[];
  onSuggestionPress: (suggestion: string) => void;
}

export function EmptyState({
  query,
  suggestions,
  onSuggestionPress,
}: EmptyStateProps) {
  return (
    <View className="items-center px-8 py-12">
      <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Magnifer size={32} color="#9CA3AF" />
      </View>
      <Text className="text-base font-medium text-gray-800 mb-1">
        Produk tidak ditemukan
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-6">
        Coba kata kunci lain atau periksa ejaanmu
      </Text>

      {suggestions.length > 0 && (
        <View className="w-full">
          <Text className="text-sm text-gray-600 mb-3">Coba cari:</Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => onSuggestionPress(suggestion)}
                className="flex-row items-center bg-white px-3 py-2 rounded-full border border-gray-200"
              >
                <SearchIcon size={12} color="#666666" />
                <Text className="text-sm text-gray-700 ml-1.5">
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
