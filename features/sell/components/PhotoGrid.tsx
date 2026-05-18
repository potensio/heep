// features/sell/components/PhotoGrid.tsx
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { GalleryAdd, Trash } from '@solar-icons/react-native/Linear';

interface PhotoGridProps {
  photos: string[];
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  maxPhotos?: number;
}

export function PhotoGrid({ photos, onAddPhoto, onRemovePhoto, maxPhotos = 6 }: PhotoGridProps) {
  const slots = Array.from({ length: maxPhotos }, (_, i) => i);

  return (
    <View className="flex-row flex-wrap gap-3">
      {slots.map((index) => {
        const photo = photos[index];
        const isEmpty = !photo;

        if (isEmpty) {
          const isFirstEmpty = index === photos.length;
          if (!isFirstEmpty && index > photos.length) return null;

          return (
            <TouchableOpacity
              key={`empty-${index}`}
              onPress={onAddPhoto}
              className="w-[31%] aspect-square rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50 active:bg-gray-100"
            >
              <GalleryAdd size={32} className="text-gray-400" />
              {photos.length === 0 && index === 0 && (
                <Text className="text-xs text-gray-400 mt-2 text-center px-2">
                  Tap untuk tambah foto
                </Text>
              )}
            </TouchableOpacity>
          );
        }

        return (
          <View key={`photo-${index}`} className="w-[31%] aspect-square rounded-xl overflow-hidden relative">
            <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
            <TouchableOpacity
              onPress={() => onRemovePhoto(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
            >
              <Trash size={14} className="text-white" />
            </TouchableOpacity>
            {index === 0 && (
              <View className="absolute bottom-0 left-0 right-0 bg-black/50 py-1">
                <Text className="text-white text-xs text-center">Cover</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
