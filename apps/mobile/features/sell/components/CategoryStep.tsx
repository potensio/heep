import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "@solar-icons/react-native/Linear";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@bantujual/categories";
import type { CategoryId, SubcategoryId } from "@bantujual/categories";
import type { CategoryStepProps } from "../types";

export function CategoryStep({
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  onNext,
  onBack,
}: CategoryStepProps) {
  const insets = useSafeAreaInsets();

  const handleSubcategoryPress = (categoryId: CategoryId, subcategoryId: SubcategoryId) => {
    onCategorySelect(categoryId);
    onSubcategorySelect(subcategoryId);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Pilih Kategori
        </Text>
        <Text className="text-gray-500 mb-6">
          Pilih jenis produk yang sesuai dengan yang akan dijual.
        </Text>

        {CATEGORIES.map((category) => (
          <View key={category.id} className="mb-6">
            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {category.label}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {category.subcategories.map((sub) => {
                const isSelected = selectedSubcategory === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => handleSubcategoryPress(category.id as CategoryId, sub.id as SubcategoryId)}
                    className={`px-4 py-2.5 rounded-xl border ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-white border-gray-200"
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background px-5 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <View className="flex-row gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft size={18} color="#000000" />}
            onPress={onBack}
          />
          <Button
            onPress={onNext}
            disabled={!selectedSubcategory}
            style={{ flex: 1 }}
          >
            Lanjut
          </Button>
        </View>
      </View>
    </View>
  );
}
