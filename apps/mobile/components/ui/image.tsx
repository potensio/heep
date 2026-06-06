import { memo } from "react";
import { Image as ExpoImage } from "expo-image";
import { StyleProp, ImageStyle, DimensionValue } from "react-native";

interface ImageProps {
  uri: string;
  blurhash?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

export const Image = memo(function Image({
  uri,
  blurhash,
  width,
  height,
  contentFit = "cover",
  style,
  testID,
}: ImageProps) {
  return (
    <ExpoImage
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
