import { View, ViewProps } from "react-native";

type CenterProps = ViewProps & { className?: string };

export function Center({ className, style, ...props }: CenterProps) {
  return (
    <View
      className={`items-center justify-center ${className || ""}`}
      style={style}
      {...props}
    />
  );
}

Center.displayName = "Center";
