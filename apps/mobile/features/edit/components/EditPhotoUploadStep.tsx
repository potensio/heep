import { View, Text, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { PhotoGrid } from '@/features/sell/components/PhotoGrid';
import type { EditPhoto } from '../types';

interface EditPhotoUploadStepProps {
  photos: EditPhoto[];
  onPhotosChange: (photos: EditPhoto[]) => void;
  onNext: () => void;
}

function toDisplayUris(photos: EditPhoto[]): string[] {
  return photos.map(p => (p.kind === 'existing' ? p.url : p.uri));
}

function fromDisplayUris(uris: string[], original: EditPhoto[]): EditPhoto[] {
  const lookup = new Map<string, EditPhoto>(
    original.map(p => [p.kind === 'existing' ? p.url : p.uri, p]),
  );
  return uris.map(uri => lookup.get(uri) ?? { kind: 'new', uri });
}

export function EditPhotoUploadStep({
  photos,
  onPhotosChange,
  onNext,
}: EditPhotoUploadStepProps) {
  const insets = useSafeAreaInsets();

  const displayUris = toDisplayUris(photos);

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
      const newEntries: EditPhoto[] = result.assets.map(a => ({ kind: 'new', uri: a.uri }));
      onPhotosChange([...photos, ...newEntries]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const handleSetCover = (index: number) => {
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    onPhotosChange([picked, ...next]);
  };

  const handleReorder = (newUris: string[]) => {
    onPhotosChange(fromDisplayUris(newUris, photos));
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-heading font-medium text-gray-900 mb-2">
          Foto Produk
        </Text>
        <Text className="text-gray-500 mb-6">
          Foto pertama akan menjadi cover. Kamu bisa menghapus atau menambah foto baru.
        </Text>

        <PhotoGrid
          photos={displayUris}
          onAddPhoto={handleAddPhoto}
          onRemovePhoto={handleRemovePhoto}
          onSetCover={handleSetCover}
          onReorder={handleReorder}
          maxPhotos={6}
        />

        {photos.length > 0 && (
          <Text className="text-sm text-gray-500 mt-4 text-center">
            {photos.length} dari 6 foto
          </Text>
        )}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background px-5 pt-4 border-t border-gray-100"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
        <Button onPress={onNext} disabled={photos.length < 1}>
          Lanjut
        </Button>
      </View>
    </View>
  );
}
