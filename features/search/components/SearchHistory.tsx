import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { History, CloseCircle } from "@solar-icons/react-native/Linear";

interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onDelete: (query: string) => void;
  onClearAll: () => void;
}

export function SearchHistory({
  history,
  onSelect,
  onDelete,
  onClearAll,
}: SearchHistoryProps) {
  if (history.length === 0) return null;

  return (
    <View className="px-5 mt-4">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <History size={16} color="#666666" />
          <Text className="text-sm font-medium text-gray-700 ml-2">
            Pencarian Terakhir
          </Text>
        </View>
        <TouchableOpacity onPress={onClearAll}>
          <Text className="text-xs text-primary">Hapus Semua</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {history.map((item, index) => (
          <TouchableOpacity
            key={`${item}-${index}`}
            onPress={() => onSelect(item)}
            className="flex-row items-center bg-white px-3 py-2 rounded-full border border-gray-200"
          >
            <Text className="text-sm text-gray-700 mr-2" numberOfLines={1}>
              {item}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseCircle size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
