import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera } from "@solar-icons/react-native/Linear";

interface ChatInputProps {
  onSend: (text: string, image?: string) => void;
  disabled?: boolean;
}

const INPUT_HEIGHT = 44;
const ICON_SIZE = 20;

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardWillShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardWillHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSend = () => {
    if (text.trim() || selectedImage) {
      onSend(text.trim(), selectedImage || undefined);
      setText("");
      setSelectedImage(null);
    }
  };

  const handleImagePick = () => {
    const mockImages = [
      "https://picsum.photos/seed/chatnew1/400/300",
      "https://picsum.photos/seed/chatnew2/400/300",
      "https://picsum.photos/seed/chatnew3/400/300",
    ];
    const randomImage =
      mockImages[Math.floor(Math.random() * mockImages.length)];
    setSelectedImage(randomImage);
  };

  const canSend = !disabled && (text.trim().length > 0 || !!selectedImage);

  const bottomPadding = isKeyboardVisible ? 8 : (insets.bottom > 0 ? insets.bottom : 12);

  return (
    <View
      className="bg-background border-t border-neutral-200"
      style={{ paddingBottom: bottomPadding }}
    >
      {disabled && (
        <View className="px-4 pt-2">
          <Text className="text-xs text-neutral-400 text-center">Menghubungkan ulang...</Text>
        </View>
      )}
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
          activeOpacity={0.7}
        >
          <Camera size={ICON_SIZE} color="#666666" />
        </TouchableOpacity>
        <View
          className="flex-1 border border-neutral-300 rounded-xl bg-white"
          style={{ height: INPUT_HEIGHT, justifyContent: "center", paddingHorizontal: 16 }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={disabled ? 'Tidak terhubung' : 'Tulis pesan...'}
            placeholderTextColor="#9CA3AF"
            className="text-base text-neutral-900"
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!disabled}
            style={{ paddingVertical: 0, lineHeight: 18, fontSize: 16, opacity: disabled ? 0.4 : 1 }}
          />
        </View>
      </View>
    </View>
  );
}
