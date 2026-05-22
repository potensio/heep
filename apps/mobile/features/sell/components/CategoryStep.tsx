import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "@solar-icons/react-native/Linear";
import { Button } from "@/components/ui/Button";
import {
  Monitor,
  Smartphone,
  Cpu,
  TShirt,
  Skirt,
  Bag,
  House,
  Bus,
  Scooter,
  Buildings,
  Volleyball,
  MusicNote,
  Balloon,
  Cosmetic,
  Cup,
  Widget,
} from "@solar-icons/react-native/Linear";
import { CATEGORY_OPTIONS, type ProductCategory } from "../types";
import type { CategoryStepProps } from "../types";

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  Monitor,
  Smartphone,
  Mobile: Smartphone,
  Cpu,
  TShirt,
  Skirt,
  Bag,
  House,
  Bus,
  Car: Bus,
  Scooter,
  Buildings,
  Volleyball,
  MusicNote,
  Balloon,
  Cosmetic,
  Cup,
  Widget,
};

export function CategoryStep({
  selectedCategory,
  onCategorySelect,
  onNext,
  onBack,
}: CategoryStepProps) {
  const insets = useSafeAreaInsets();

  const handleCategorySelect = (category: ProductCategory) => {
    onCategorySelect(category);
  };

  const handleNext = () => {
    if (selectedCategory) {
      onNext();
    }
  };

  const renderCategoryIcon = (
    iconName: string,
    size: number = 28,
    color?: string,
  ) => {
    const IconComponent = iconMap[iconName] || Widget;
    return <IconComponent size={size} color={color} />;
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

        {/* Category Chips - Centered, Medium Pills */}
        <View className="flex-row flex-wrap justify-center gap-2.5">
          {CATEGORY_OPTIONS.map((category) => {
            const isSelected = selectedCategory === category.value;
            return (
              <TouchableOpacity
                key={category.value}
                onPress={() => handleCategorySelect(category.value)}
                className={`flex-row items-center px-4 py-3 rounded-xl border ${
                  isSelected
                    ? "bg-orange border-orange"
                    : "bg-white border-gray-200"
                }`}
                activeOpacity={0.8}
              >
                {renderCategoryIcon(
                  category.icon,
                  18,
                  isSelected ? "#FFFFFF" : "#F54802",
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

      {/* Footer with CTAs */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-background px-5 pt-4 pb-6 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onBack}
            className="flex-row items-center justify-center py-4 px-5 rounded-xl border border-gray-300 bg-white"
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>

          <Button
            onPress={handleNext}
            disabled={!selectedCategory}
            style={{ flex: 1 }}
          >
            Lanjut
          </Button>
        </View>
      </View>
    </View>
  );
}
