// features/sell/components/ProductInfoStep.tsx
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowRight, 
  ArrowLeft, 
  Monitor, 
  TShirt, 
  Skirt, 
  Bag, 
  House, 
  Wheel, 
  Buildings, 
  Volleyball, 
  Balloon, 
  Cosmetic, 
  Cup, 
  Widget 
} from '@solar-icons/react-native/Linear';
import { PriceInput } from './PriceInput';
import { CATEGORY_OPTIONS, type ProductCategory } from '../types';
import type { ProductInfoStepProps } from '../types';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Monitor,
  TShirt,
  Skirt,
  Bag,
  House,
  Wheel,
  Buildings,
  Volleyball,
  Balloon,
  Cosmetic,
  Cup,
  Widget,
};

export function ProductInfoStep({ formData, onFormChange, onNext, onBack, isDevMode = false }: ProductInfoStepProps) {
  const insets = useSafeAreaInsets();

  const validateAndProceed = () => {
    if (!formData.category) {
      return;
    }
    if (formData.name.length < 3) {
      return;
    }
    if (formData.price < 1000) {
      return;
    }
    onNext();
  };

  const isCategoryValid = formData.category !== '';
  const isNameValid = formData.name.length >= 3;
  const isPriceValid = formData.price >= 1000;
  const canProceed = isDevMode || (isCategoryValid && isNameValid && isPriceValid);

  const handleCategorySelect = (category: ProductCategory) => {
    onFormChange({ category });
  };

  const renderCategoryIcon = (iconName: string, size: number = 20) => {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  };

  return (
    <View className="flex-1 bg-[#F9F2E6]">
      <ScrollView 
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Info Produk
        </Text>
        <Text className="text-gray-500 mb-6">
          Isi informasi dasar produk yang akan dijual.
        </Text>

        {/* Kategori Produk */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-3">
            Kategori Produk <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => {
              const isSelected = formData.category === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleCategorySelect(option.value)}
                  className={`flex-row items-center px-3 py-2 rounded-full border ${
                    isSelected 
                      ? 'bg-[#9AE600] border-[#9AE600]' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <View className={isSelected ? 'text-gray-900' : 'text-gray-600'}>
                    {renderCategoryIcon(option.icon, 16)}
                  </View>
                  <Text 
                    className={`ml-1.5 text-xs font-medium ${
                      isSelected ? 'text-gray-900' : 'text-gray-700'
                    }`}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!isCategoryValid && !isDevMode && (
            <Text className="text-xs text-red-500 mt-2">
              Pilih kategori produk
            </Text>
          )}
        </View>

        {/* Nama Produk */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Nama Produk <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 text-base"
            value={formData.name}
            onChangeText={(text) => onFormChange({ name: text })}
            placeholder="Contoh: Sepatu Sneakers Nike Air Max 90"
            maxLength={100}
          />
          <View className="flex-row justify-between mt-1">
            <Text className={`text-xs ${!isNameValid && formData.name.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {!isNameValid && formData.name.length > 0 ? 'Minimal 3 karakter' : ''}
            </Text>
            <Text className="text-xs text-gray-400">
              {formData.name.length}/100
            </Text>
          </View>
        </View>

        {/* Harga */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Harga <Text className="text-red-500">*</Text>
          </Text>
          <PriceInput
            value={formData.price}
            onChange={(value) => onFormChange({ price: value })}
            placeholder="0"
          />
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
            className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 text-base"
            value={formData.description}
            onChangeText={(text) => onFormChange({ description: text })}
            placeholder="Jelaskan kondisi barang, ukuran, warna, atau informasi penting lainnya"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ height: 100 }}
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
            className="flex-row items-center justify-center py-4 px-5 rounded-xl border border-gray-300 bg-white"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={isDevMode ? onNext : validateAndProceed}
            disabled={!canProceed}
            className={`flex-1 flex-row items-center justify-center py-4 rounded-xl ${
              canProceed ? 'bg-[#9AE600]' : 'bg-gray-300'
            }`}
          >
            <Text className={`font-semibold text-base mr-2 ${
              canProceed ? 'text-gray-900' : 'text-gray-500'
            }`}>
              Lanjut ke Review
            </Text>
            <ArrowRight size={20} className={canProceed ? 'text-gray-900' : 'text-gray-500'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
