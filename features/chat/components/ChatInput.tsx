import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Plain2 } from '@solar-icons/react-native/Linear';

interface ChatInputProps {
  onSend: (text: string, image?: string) => void;
}

const INPUT_HEIGHT = 44;
const ICON_SIZE = 20;
const BUTTON_SIZE = 36;

export function ChatInput({ onSend }: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSend = () => {
    if (text.trim() || selectedImage) {
      onSend(text.trim(), selectedImage || undefined);
      setText('');
      setSelectedImage(null);
    }
  };

  const handleImagePick = () => {
    const mockImages = [
      'https://picsum.photos/seed/chatnew1/400/300',
      'https://picsum.photos/seed/chatnew2/400/300',
      'https://picsum.photos/seed/chatnew3/400/300',
    ];
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    setSelectedImage(randomImage);
  };

  const canSend = text.trim().length > 0 || selectedImage;

  return (
    <View
      className="bg-white border-t border-neutral-200"
      style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }}
    >
      {selectedImage && (
        <View className="px-4 pt-3 relative">
          <Image
            source={{ uri: selectedImage }}
            className="w-16 h-16 rounded-xl"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute left-16 top-1 bg-neutral-900 rounded-full w-5 h-5 items-center justify-center"
          >
            <Text className="text-white text-xs font-bold">×</Text>
          </TouchableOpacity>
        </View>
      )}
      <View className="flex-row items-center px-4 pt-3 gap-3">
        <TouchableOpacity
          onPress={handleImagePick}
          className="items-center justify-center"
          style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          activeOpacity={0.7}
        >
          <Camera size={ICON_SIZE} color="#666666" />
        </TouchableOpacity>
        <View
          className="flex-1 border border-neutral-300 rounded-xl bg-white px-4"
          style={{ height: INPUT_HEIGHT }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Tulis pesan..."
            placeholderTextColor="#9CA3AF"
            className="text-base text-neutral-900"
            style={{ height: INPUT_HEIGHT }}
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          className="items-center justify-center rounded-xl"
          style={{
            width: INPUT_HEIGHT,
            height: INPUT_HEIGHT,
            backgroundColor: canSend ? '#c5e302' : '#E5E7EB',
          }}
          activeOpacity={0.7}
        >
          <Plain2 size={ICON_SIZE} color={canSend ? '#0A0A0A' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
