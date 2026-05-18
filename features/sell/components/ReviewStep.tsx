// features/sell/components/ReviewStep.tsx
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Gallery, PenNewSquare } from '@solar-icons/react-native/Linear';
import { CATEGORY_OPTIONS } from '../types';
import type { ReviewStepProps } from '../types';

function formatRupiah(value: number): string {
  if (!value || value === 0) return 'Rp 0';
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getCategoryLabel(categoryValue: string): string {
  const category = CATEGORY_OPTIONS.find(cat => cat.value === categoryValue);
  return category?.label || categoryValue;
}

export function ReviewStep({ 
  formData, 
  isSubmitting, 
  onEditPhotos, 
  onEditInfo, 
  onPublish, 
  onBack 
}: ReviewStepProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F9F2E6]">
      <ScrollView 
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Review Produk
        </Text>
        <Text className="text-gray-500 mb-6">
          Periksa kembali informasi produk sebelum dipublish.
        </Text>

        {/* Product Preview Card */}
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6">
          {/* Cover Photo */}
          {formData.photos[0] && (
            <View className="relative">
              <Image 
                source={{ uri: formData.photos[0] }} 
                className="w-full h-48"
                resizeMode="cover"
              />
              {formData.photos.length > 1 && (
                <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs">+{formData.photos.length - 1} foto</Text>
                </View>
              )}
            </View>
          )}

          {/* Product Info */}
          <View className="p-4">
            {/* Category Badge */}
            {formData.category && (
              <View className="self-start bg-[#9AE600]/20 px-3 py-1 rounded-full mb-2">
                <Text className="text-xs font-medium text-gray-800">
                  {getCategoryLabel(formData.category)}
                </Text>
              </View>
            )}
            
            <Text className="text-lg font-semibold text-gray-900 mb-1" numberOfLines={2}>
              {formData.name}
            </Text>
            <Text className="text-xl font-bold text-[#7CCF00] mb-3">
              {formatRupiah(formData.price)}
            </Text>
            
            {formData.description ? (
              <Text className="text-gray-600 text-sm leading-5" numberOfLines={4}>
                {formData.description}
              </Text>
            ) : (
              <Text className="text-gray-400 text-sm italic">
                Tidak ada deskripsi
              </Text>
            )}
          </View>
        </View>

        {/* Edit Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={onEditPhotos}
            className="flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl border border-gray-300 bg-white"
          >
            <Gallery size={18} className="text-gray-700 mr-2" />
            <Text className="text-gray-700 font-medium text-sm">Edit Foto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onEditInfo}
            className="flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl border border-gray-300 bg-white"
          >
            <PenNewSquare size={18} className="text-gray-700 mr-2" />
            <Text className="text-gray-700 font-medium text-sm">Edit Info</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <Text className="text-xs text-gray-500 text-center">
          Produk akan langsung terlihat oleh pembeli setelah dipublish
        </Text>
      </ScrollView>

      {/* Footer with CTAs */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-6 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onBack}
            disabled={isSubmitting}
            className="flex-row items-center justify-center py-4 px-5 rounded-xl border border-gray-300 bg-white"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onPublish}
            disabled={isSubmitting}
            className={`flex-1 flex-row items-center justify-center py-4 rounded-xl ${
              isSubmitting ? 'bg-gray-300' : 'bg-[#9AE600]'
            }`}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#6B7280" className="mr-2" />
                <Text className="font-semibold text-base text-gray-500">
                  Mempublish...
                </Text>
              </>
            ) : (
              <>
                <Text className="font-semibold text-base mr-2 text-gray-900">
                  Publish Sekarang
                </Text>
                <ArrowRight size={20} className="text-gray-900" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
