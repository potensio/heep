import { View, ViewProps } from "react-native";

type BoxProps = ViewProps & { className?: string };

export function Box({ className, style, ...props }: BoxProps) {
  return <View className={className} style={style} {...props} />;
}

Box.displayName = "Box";
