import { useRef, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "@solar-icons/react-native/Linear";
import { Bus, Buildings, Smartphone } from "@solar-icons/react-native/Linear";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@bantujual/categories";
import type { CategoryId, SubcategoryId } from "@bantujual/categories";
import type { CategoryStepProps } from "../types";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Car: Bus, // Solar Linear has no Car icon; Bus is the closest vehicle icon
  Buildings,
  Smartphone,
};

export function CategoryStep({
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  onNext,
  onBack,
}: CategoryStepProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["40%"], []);

  const selectedCategoryDef = CATEGORIES.find(c => c.id === selectedCategory);

  const handleCategoryPress = useCallback((categoryId: CategoryId) => {
    if (categoryId !== selectedCategory) {
      onCategorySelect(categoryId);
    }
    sheetRef.current?.present();
  }, [onCategorySelect, selectedCategory]);

  const handleSubcategorySelect = useCallback((subcategoryId: SubcategoryId) => {
    onSubcategorySelect(subcategoryId);
    sheetRef.current?.dismiss();
  }, [onSubcategorySelect]);

  const renderIcon = (iconName: string, size: number, color?: string) => {
    const Icon = iconMap[iconName] || Bus;
    return <Icon size={size} color={color} />;
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
          Pilih kategori yang sesuai dengan produk yang akan dijual.
        </Text>

        <View className="flex-row flex-wrap justify-center gap-2.5">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryPress(category.id as CategoryId)}
                className={`flex-row items-center px-4 py-3 rounded-xl border ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-white border-gray-200"
                }`}
                activeOpacity={0.8}
              >
                {renderIcon(
                  category.icon,
                  18,
                  isSelected ? "#FFFFFF" : "#155DFC",
                )}
                <Text
                  className={`ml-2 text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-700"
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background px-5 pt-4 pb-6 border-t border-gray-100"
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
            disabled={!selectedCategory || !selectedSubcategory}
            style={{ flex: 1 }}
          >
            Lanjut
          </Button>
        </View>
      </View>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
      >
        <BottomSheetView style={[styles.sheetContent, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>
            Pilih Jenis {selectedCategoryDef?.label}
          </Text>
          <View style={styles.chipsRow}>
            {selectedCategoryDef?.subcategories.map((sub) => {
              const isSelected = selectedSubcategory === sub.id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => handleSubcategorySelect(sub.id as SubcategoryId)}
                  className={`px-4 py-3 rounded-xl border ${
                    isSelected ? "bg-primary border-primary" : "bg-white border-gray-200"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-700"}`}>
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: { paddingHorizontal: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Fjalla-One", marginBottom: 16 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
});
