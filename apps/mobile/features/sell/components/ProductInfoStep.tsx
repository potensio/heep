// features/sell/components/ProductInfoStep.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { ArrowLeft, Tag } from "@solar-icons/react-native/Linear";
import { Button } from "@/components/ui/Button";
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from "../types";
import type { ProductInfoStepProps } from "../types";

// Native input container styling - height 50px to match Picker, font 16px
const INPUT_HEIGHT = 50;
const INPUT_FONT_SIZE = 16;
const INPUT_CONTAINER =
  "border border-gray-300 rounded-xl bg-white overflow-hidden";

function getCategoryLabel(categoryValue: string): string {
  const category = CATEGORY_OPTIONS.find((cat) => cat.value === categoryValue);
  return category?.label || categoryValue;
}

export function ProductInfoStep({
  formData,
  onFormChange,
  onNext,
  onBack,
  isDevMode = false,
}: ProductInfoStepProps) {
  const insets = useSafeAreaInsets();
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const validateAndProceed = () => {
    if (formData.name.length < 3) {
      return;
    }
    if (formData.price < 1000) {
      return;
    }
    onNext();
  };

  const isNameValid = formData.name.length >= 3;
  const isPriceValid = formData.price >= 1000;
  const canProceed = isDevMode || (isNameValid && isPriceValid);

  const handlePriceChange = (text: string) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, "");
    const value = numericValue ? parseInt(numericValue, 10) : 0;
    onFormChange({ price: value });
  };

  // Format price for display
  const formatPriceDisplay = (value: number): string => {
    if (!value || value === 0) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Info Produk
        </Text>
        <Text className="text-gray-500 mb-6">
          Isi informasi dasar produk yang akan dijual.
        </Text>

        {/* Selected Category Display */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Kategori Dipilih
          </Text>
          <View className="flex-row items-center bg-orange/10 border border-orange/20 rounded-xl px-4 py-3">
            <Tag size={18} color="#F97316" />
            <Text className="ml-2 text-gray-900 font-medium">
              {getCategoryLabel(formData.category)}
            </Text>
          </View>
        </View>

        {/* Kondisi Produk */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Kondisi <Text className="text-red-500">*</Text>
          </Text>

          {Platform.OS === "ios" ? (
            <TouchableOpacity
              onPress={() => setShowConditionPicker(true)}
              className={`${INPUT_CONTAINER} px-4 flex-row items-center justify-between`}
              style={{ height: INPUT_HEIGHT }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: INPUT_FONT_SIZE,
                  color: formData.condition ? "#111827" : "#9CA3AF",
                }}
              >
                {formData.condition || "Pilih kondisi..."}
              </Text>
              <View className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400" />
            </TouchableOpacity>
          ) : (
            <View className={INPUT_CONTAINER}>
              <Picker
                selectedValue={formData.condition}
                onValueChange={(value) => onFormChange({ condition: value })}
                dropdownIconColor="#9CA3AF"
              >
                <Picker.Item
                  label="Pilih kondisi..."
                  value=""
                  color="#9CA3AF"
                />
                {CONDITION_OPTIONS.map((condition) => (
                  <Picker.Item
                    key={condition}
                    label={condition}
                    value={condition}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* iOS Picker Modal */}
        {Platform.OS === "ios" && showConditionPicker && (
          <View className="bg-gray-50 border border-gray-200 rounded-xl mb-4 overflow-hidden">
            <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-200">
              <Text className="text-sm font-medium text-gray-700">
                Pilih Kondisi
              </Text>
              <TouchableOpacity onPress={() => setShowConditionPicker(false)}>
                <Text className="text-primary font-medium">Selesai</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={formData.condition}
              onValueChange={(value) => onFormChange({ condition: value })}
            >
              <Picker.Item label="Pilih kondisi" value="" />
              {CONDITION_OPTIONS.map((condition) => (
                <Picker.Item
                  key={condition}
                  label={condition}
                  value={condition}
                />
              ))}
            </Picker>
          </View>
        )}

        {/* Nama Produk */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Nama Produk <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`${INPUT_CONTAINER} px-4 text-gray-900`}
            style={{ height: INPUT_HEIGHT, fontSize: INPUT_FONT_SIZE }}
            value={formData.name}
            onChangeText={(text) => onFormChange({ name: text })}
            placeholder="Contoh: Sepatu Sneakers Nike Air Max 90"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />
          <View className="flex-row justify-between mt-1">
            <Text
              className={`text-xs ${!isNameValid && formData.name.length > 0 ? "text-red-500" : "text-gray-400"}`}
            >
              {!isNameValid && formData.name.length > 0
                ? "Minimal 3 karakter"
                : ""}
            </Text>
            <Text className="text-xs text-gray-400">
              {formData.name.length}/100
            </Text>
          </View>
        </View>

        {/* Harga - Native TextInput with number pad */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Harga <Text className="text-red-500">*</Text>
          </Text>
          <View
            className={`${INPUT_CONTAINER} flex-row items-center`}
            style={{ height: INPUT_HEIGHT }}
          >
            <Text
              className="text-gray-500 ml-4 mr-2"
              style={{ fontSize: INPUT_FONT_SIZE }}
            >
              Rp
            </Text>
            <TextInput
              className="flex-1 pr-4 text-gray-900"
              style={{ fontSize: INPUT_FONT_SIZE }}
              value={formatPriceDisplay(formData.price)}
              onChangeText={handlePriceChange}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={12}
            />
          </View>
          <Text
            className={`text-xs mt-1 ${!isPriceValid && formData.price > 0 ? "text-red-500" : "text-gray-400"}`}
          >
            {!isPriceValid && formData.price > 0
              ? "Harga minimal Rp 1.000"
              : "Minimal Rp 1.000"}
          </Text>
        </View>

        {/* Deskripsi */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Deskripsi <Text className="text-gray-400">(opsional)</Text>
          </Text>
          <TextInput
            className={`${INPUT_CONTAINER} px-4 pt-3 text-gray-900`}
            value={formData.description}
            onChangeText={(text) => onFormChange({ description: text })}
            placeholder="Jelaskan kondisi barang, ukuran, warna, dll"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ height: 100, fontSize: INPUT_FONT_SIZE }}
            maxLength={500}
          />
          <Text className="text-xs text-gray-400 mt-1 text-right">
            {formData.description.length}/500
          </Text>
        </View>
      </ScrollView>

      {/* Footer with CTAs */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-6 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        {isDevMode && (
          <View className="mb-3 p-2 bg-yellow-100 rounded-lg border border-yellow-300">
            <Text className="text-xs text-yellow-800 text-center">
              🛠️ DEV MODE: Validation bypassed
            </Text>
          </View>
        )}

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onBack}
            className="flex-row items-center justify-center py-4 px-5 rounded-xl border border-gray-300 bg-background"
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>

          <Button
            onPress={isDevMode ? onNext : validateAndProceed}
            disabled={!canProceed}
            style={{ flex: 1 }}
          >
            Lanjut ke Review
          </Button>
        </View>
      </View>
    </View>
  );
}
