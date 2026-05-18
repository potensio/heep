// features/sell/components/ProductInfoStep.tsx
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft } from '@solar-icons/react-native/Linear';
import { PriceInput } from './PriceInput';
import type { ProductInfoStepProps } from '../types';

export function ProductInfoStep({ formData, onFormChange, onNext, onBack }: ProductInfoStepProps) {
  const insets = useSafeAreaInsets();

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
  const canProceed = isNameValid && isPriceValid;

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
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onBack}
            className="flex-row items-center justify-center py-4 px-5 rounded-xl border border-gray-300 bg-white"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={validateAndProceed}
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
