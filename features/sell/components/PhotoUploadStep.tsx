// features/sell/components/PhotoUploadStep.tsx
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowRight } from '@solar-icons/react-native/Linear';
import { PhotoGrid } from './PhotoGrid';
import type { PhotoUploadStepProps } from '../types';

export function PhotoUploadStep({ photos, onPhotosChange, onNext }: PhotoUploadStepProps) {
  const insets = useSafeAreaInsets();

  const handleAddPhoto = async () => {
    const remainingSlots = 6 - photos.length;
    if (remainingSlots <= 0) {
      Alert.alert('Maksimal Foto', 'Kamu hanya bisa upload maksimal 6 foto');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Kamu perlu memberikan izin akses galeri');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      onPhotosChange([...photos, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const handleNext = () => {
    if (photos.length < 1) {
      Alert.alert('Foto Diperlukan', 'Tambahkan minimal 1 foto untuk melanjutkan');
      return;
    }
    onNext();
  };

  const canProceed = photos.length >= 1;

  return (
    <View className="flex-1 bg-[#F9F2E6]">
      <ScrollView 
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Upload Foto Produk
        </Text>
        <Text className="text-gray-500 mb-6">
          Tambahkan minimal 1 foto dan maksimal 6 foto. Foto pertama akan menjadi cover produk.
        </Text>

        <PhotoGrid
          photos={photos}
          onAddPhoto={handleAddPhoto}
          onRemovePhoto={handleRemovePhoto}
          maxPhotos={6}
        />

        {photos.length > 0 && (
          <Text className="text-sm text-gray-500 mt-4 text-center">
            {photos.length} dari 6 foto
          </Text>
        )}
      </ScrollView>

      {/* Footer with CTA */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-6 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed}
          className={`flex-row items-center justify-center py-4 rounded-xl ${
            canProceed ? 'bg-[#9AE600]' : 'bg-gray-300'
          }`}
        >
          <Text className={`font-semibold text-base mr-2 ${
            canProceed ? 'text-gray-900' : 'text-gray-500'
          }`}>
            Lanjut
          </Text>
          <ArrowRight size={20} className={canProceed ? 'text-gray-900' : 'text-gray-500'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
