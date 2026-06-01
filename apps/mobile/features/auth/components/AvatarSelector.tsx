import { View, Image, TouchableOpacity } from "react-native";
import { useEffect } from "react";

export const AVATARS = [
  "https://media.thenightshift.dev/default-avatar/avatar-male-a.png",
  "https://media.thenightshift.dev/default-avatar/avatar-male-b.png",
  "https://media.thenightshift.dev/default-avatar/avatar-male-c.png",
  "https://media.thenightshift.dev/default-avatar/avatar-male-d.png",
  "https://media.thenightshift.dev/default-avatar/avatar-male-e.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-a.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-b.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-c.png",
  "https://media.thenightshift.dev/default-avatar/avatar-female-d.png",
];

// Preload all avatar images
export function preloadAvatars() {
  AVATARS.forEach((url) => {
    Image.prefetch(url);
  });
}

interface AvatarSelectorProps {
  value: string | null;
  onChange: (url: string) => void;
}

export function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  // Ensure avatars are preloaded when component mounts
  useEffect(() => {
    preloadAvatars();
  }, []);

  return (
    <View className="items-center">
      <View className="flex-row gap-3 mb-3">
        {AVATARS.slice(0, 5).map((url) => (
          <TouchableOpacity
            key={url}
            onPress={() => onChange(url)}
            activeOpacity={0.8}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: value === url ? 3 : 2,
              borderColor: value === url ? "#155DFC" : "#D1D5DB",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={{ uri: url }}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
      <View className="flex-row gap-3" style={{ paddingLeft: 40 }}>
        {AVATARS.slice(5).map((url) => (
          <TouchableOpacity
            key={url}
            onPress={() => onChange(url)}
            activeOpacity={0.8}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: value === url ? 3 : 2,
              borderColor: value === url ? "#155DFC" : "#D1D5DB",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={{ uri: url }}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
