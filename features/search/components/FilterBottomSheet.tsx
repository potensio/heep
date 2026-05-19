import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useCallback, useState } from "react";
import { CheckSquare, CloseSquare } from "@solar-icons/react-native/Linear";

interface FilterBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  categories: string[];
  priceRange: "all" | "under100k" | "100k-500k" | "500k-1m" | "above1m";
}

const categories = [
  "Fashion Pria",
  "Fashion Wanita",
  "Elektronik",
  "Aksesoris",
  "Sepatu",
  "Tas",
  "Jam Tangan",
];

const priceRanges = [
  { value: "all", label: "Semua Harga" },
  { value: "under100k", label: "Di bawah Rp 100.000" },
  { value: "100k-500k", label: "Rp 100.000 - 500.000" },
  { value: "500k-1m", label: "Rp 500.000 - 1.000.000" },
  { value: "above1m", label: "Di atas Rp 1.000.000" },
] as const;

export function FilterBottomSheet({
  bottomSheetRef,
  onApply,
}: FilterBottomSheetProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] =
    useState<FilterState["priceRange"]>"all";

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, [bottomSheetRef]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleApply = useCallback(() => {
    onApply({
      categories: selectedCategories,
      priceRange: selectedPriceRange,
    });
    handleClose();
  }, [selectedCategories, selectedPriceRange, onApply, handleClose]);

  const handleReset = useCallback(() => {
    setSelectedCategories([]);
    setSelectedPriceRange("all");
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["60%"]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40 }}
    >
      <BottomSheetView className="flex-1 px-5 pt-2 pb-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-heading font-medium text-gray-900">
            Filter
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <CloseSquare size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Kategori
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedCategories.includes(category)
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedCategories.includes(category)
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Rentang Harga
            </Text>
            <View className="gap-2">
              {priceRanges.map((range) => (
                <TouchableOpacity
                  key={range.value}
                  onPress={() =>
                    setSelectedPriceRange(
                      range.value as FilterState["priceRange"]
                    )
                  }
                  className={`flex-row items-center justify-between py-3 px-4 rounded-xl ${
                    selectedPriceRange === range.value
                      ? "bg-primary/10"
                      : "bg-gray-50"
                  }`}
                >
                  <Text
                    className={`text-base ${
                      selectedPriceRange === range.value
                        ? "text-primary font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {range.label}
                  </Text>
                  {selectedPriceRange === range.value && (
                    <CheckSquare size={20} color="#155DFC" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-4 pt-4 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleReset}
            className="flex-1 py-3 rounded-xl border border-gray-300 bg-white"
          >
            <Text className="text-center text-gray-700 font-medium">
              Reset
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApply}
            className="flex-1 py-3 rounded-xl bg-primary"
          >
            <Text className="text-center text-white font-medium">
              Terapkan
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
