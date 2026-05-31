// features/sell/components/ProductInfoStep.tsx
import { useState, useEffect } from 'react';
import {
  ActionSheetIOS,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MapPoint, Tag } from "@solar-icons/react-native/Linear";
import { CityPicker } from '@/features/shared/components/CityPicker';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@bantujual/categories";
import type { CategoryAttribute } from "@bantujual/categories";
import type { ProductInfoStepProps } from "../types";

const INPUT_HEIGHT = 50;
const INPUT_FONT_SIZE = 16;
const INPUT_CONTAINER = "border border-gray-300 rounded-xl bg-white overflow-hidden";

function AttributeField({
  attribute,
  value,
  onChange,
  onClear,
}: {
  attribute: CategoryAttribute;
  value: string | number | undefined;
  onChange: (val: string | number) => void;
  onClear?: () => void;
}) {
  const showIOSPicker = () => {
    if (attribute.type !== 'select' || !attribute.options) return;
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Batal', ...attribute.options], cancelButtonIndex: 0 },
      (i) => { if (i !== 0 && attribute.options) onChange(attribute.options[i - 1]); }
    );
  };

  if (attribute.type === 'select' && attribute.options) {
    const useChips = attribute.options.length <= 5;
    return (
      <View className="mb-5">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {attribute.label}
          {attribute.required && <Text className="text-red-500"> *</Text>}
        </Text>
        {useChips ? (
          <View className="flex-row flex-wrap gap-2">
            {attribute.options.map((opt) => {
              const isSelected = value === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => onChange(opt)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-200'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className={INPUT_CONTAINER}>
            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                onPress={showIOSPicker}
                className="px-4 flex-row items-center justify-between"
                style={{ height: INPUT_HEIGHT }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: INPUT_FONT_SIZE, color: value ? '#111827' : '#9CA3AF' }}>
                  {value ? String(value) : `Pilih ${attribute.label.toLowerCase()}...`}
                </Text>
                <View className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400" />
              </TouchableOpacity>
            ) : (
              <Picker
                selectedValue={value ? String(value) : ''}
                onValueChange={(v) => { if (v) onChange(v); }}
                dropdownIconColor="#9CA3AF"
              >
                <Picker.Item label={`Pilih ${attribute.label.toLowerCase()}...`} value="" color="#9CA3AF" />
                {attribute.options.map((opt) => (
                  <Picker.Item key={opt} label={opt} value={opt} />
                ))}
              </Picker>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="mb-5">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        {attribute.label}
        {attribute.required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`${INPUT_CONTAINER} px-4 text-gray-900`}
        style={{ height: INPUT_HEIGHT, fontSize: INPUT_FONT_SIZE }}
        value={value !== undefined && value !== '' ? String(value) : ''}
        onChangeText={(text) => {
          if (attribute.type === 'number') {
            const num = text.replace(/[^0-9]/g, '');
            if (num) {
              onChange(parseInt(num, 10));
            } else {
              onClear?.();
            }
          } else {
            onChange(text);
          }
        }}
        placeholder={attribute.label}
        placeholderTextColor="#9CA3AF"
        keyboardType={attribute.type === 'number' ? 'number-pad' : 'default'}
      />
    </View>
  );
}

export function ProductInfoStep({
  formData,
  onFormChange,
  onNext,
  onBack,
  isDevMode = false,
}: ProductInfoStepProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    if (!formData.location && user?.location) {
      onFormChange({ location: user.location });
    }
  }, []);

  const selectedCategoryDef = CATEGORIES.find(c => c.id === formData.category);
  const selectedSubcategoryDef = selectedCategoryDef?.subcategories.find(
    s => s.id === formData.subcategory
  );
  const allAttributes: CategoryAttribute[] = [
    ...((selectedCategoryDef?.sharedAttributes ?? []) as CategoryAttribute[]),
    ...((selectedSubcategoryDef?.attributes ?? []) as CategoryAttribute[]),
  ];

  const isNameValid = formData.name.length >= 3;
  const isPriceValid = formData.price >= 1000;
  const isLocationValid = formData.location !== null;
  const isSubcategoryValid = formData.subcategory !== '';
  const requiredAttributesFilled = allAttributes
    .filter(a => a.required)
    .every(a => {
      const v = formData.attributes[a.id];
      return v !== undefined && v !== '';
    });
  const canProceed = isDevMode || (
    isNameValid && isPriceValid && isLocationValid &&
    isSubcategoryValid && requiredAttributesFilled
  );

  const validateAndProceed = () => {
    if (!canProceed) return;
    onNext();
  };

  const handlePriceChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    onFormChange({ price: numeric ? parseInt(numeric, 10) : 0 });
  };

  const formatPriceDisplay = (value: number): string => {
    if (!value || value === 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
          <Text className="text-sm font-medium text-gray-700 mb-2">Kategori Dipilih</Text>
          <View className="flex-row items-center bg-orange/10 border border-orange/20 rounded-xl px-4 py-3">
            <Tag size={18} color="#F97316" />
            <Text className="ml-2 text-gray-900 font-medium">
              {selectedCategoryDef?.label ?? formData.category}
            </Text>
          </View>
        </View>

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
            placeholder="Contoh: Honda Beat 2020 Mulus"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />
          <View className="flex-row justify-between mt-1">
            <Text className={`text-xs ${!isNameValid && formData.name.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {!isNameValid && formData.name.length > 0 ? 'Minimal 3 karakter' : ''}
            </Text>
            <Text className="text-xs text-gray-400">{formData.name.length}/100</Text>
          </View>
        </View>

        {/* Harga */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Harga <Text className="text-red-500">*</Text>
          </Text>
          <View className={`${INPUT_CONTAINER} flex-row items-center`} style={{ height: INPUT_HEIGHT }}>
            <Text className="text-gray-500 ml-4 mr-2" style={{ fontSize: INPUT_FONT_SIZE }}>Rp</Text>
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
          <Text className={`text-xs mt-1 ${!isPriceValid && formData.price > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {!isPriceValid && formData.price > 0 ? 'Harga minimal Rp 1.000' : 'Minimal Rp 1.000'}
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

        {/* Lokasi */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Lokasi <Text className="text-red-500">*</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setShowCityPicker(true)}
            className={INPUT_CONTAINER}
            style={{ height: INPUT_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}
            activeOpacity={0.8}
          >
            <MapPoint size={16} color={formData.location ? '#155DFC' : '#9CA3AF'} />
            <Text
              className="flex-1 ml-2"
              style={{ fontSize: INPUT_FONT_SIZE, color: formData.location ? '#111827' : '#9CA3AF' }}
            >
              {formData.location ? formData.location.name : 'Pilih kota...'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subkategori */}
        {selectedCategoryDef && (
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Jenis <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {selectedCategoryDef.subcategories.map((sub) => {
                const isSelected = formData.subcategory === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => onFormChange({ subcategory: sub.id as typeof formData.subcategory, attributes: {} })}
                    className={`px-4 py-2.5 rounded-xl border ${
                      isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-200'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Dynamic Attribute Fields */}
        {formData.subcategory !== '' && allAttributes.map((attr) => (
          <AttributeField
            key={attr.id}
            attribute={attr}
            value={formData.attributes[attr.id]}
            onChange={(val) =>
              onFormChange({ attributes: { ...formData.attributes, [attr.id]: val } })
            }
            onClear={() => {
              const next = { ...formData.attributes };
              delete next[attr.id];
              onFormChange({ attributes: next });
            }}
          />
        ))}
      </ScrollView>

      {showCityPicker && (
        <CityPicker
          value={formData.location}
          onSelect={(loc) => { onFormChange({ location: loc }); setShowCityPicker(false); }}
          onClose={() => setShowCityPicker(false)}
        />
      )}

      <View
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-6"
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
