import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Camera, Plain2 } from '@solar-icons/react-native/Linear';

interface ChatInputProps {
  onSend: (text: string, image?: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
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
    <View className="bg-white px-4 py-3 border-t border-neutral-200">
      {selectedImage && (
        <View className="mb-2 relative">
          <Image
            source={{ uri: selectedImage }}
            className="w-20 h-20 rounded-lg"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-neutral-800 rounded-full w-6 h-6 items-center justify-center"
          >
            <Text className="text-white text-xs font-bold">×</Text>
          </TouchableOpacity>
        </View>
      )}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={handleImagePick}
          className="w-10 h-10 items-center justify-center rounded-full bg-neutral-100"
          activeOpacity={0.7}
        >
          <Camera size={22} color="#666666" />
        </TouchableOpacity>
        <View className="flex-1 bg-neutral-100 rounded-full px-4 py-2.5">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Tulis pesan..."
            placeholderTextColor="#9CA3AF"
            className="text-base text-neutral-900"
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          className={`w-10 h-10 items-center justify-center rounded-full ${
            canSend ? 'bg-primary-500' : 'bg-neutral-200'
          }`}
          activeOpacity={0.7}
        >
          <Plain2 size={20} color={canSend ? '#FFFFFF' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
