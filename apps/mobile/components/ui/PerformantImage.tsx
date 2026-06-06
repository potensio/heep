import { memo } from "react";
import { Image } from "expo-image";
import { StyleProp, ImageStyle, DimensionValue } from "react-native";

interface PerformantImageProps {
  uri: string;
  blurhash?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

export const PerformantImage = memo(function PerformantImage({
  uri,
  blurhash,
  width,
  height,
  contentFit = "cover",
  style,
  testID,
}: PerformantImageProps) {
  return (
    <Image
      source={{ uri }}
      placeholder={blurhash ? { blurhash } : undefined}
      cachePolicy="memory-disk"
      transition={200}
      contentFit={contentFit}
      style={[{ width, height }, style]}
      testID={testID}
    />
  );
});
