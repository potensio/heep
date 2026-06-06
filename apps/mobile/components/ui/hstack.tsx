import { View, ViewProps } from "react-native";

type HStackProps = ViewProps & {
  className?: string;
  space?: "0" | "0.5" | "1" | "1.5" | "2" | "2.5" | "3" | "3.5" | "4" | "5" | "6" | "8" | "10" | "12" | "16";
  reversed?: boolean;
};

export function HStack({ className, space, reversed, style, ...props }: HStackProps) {
  const gapClass = space ? `gap-${space}` : "";
  const direction = reversed ? "flex-row-reverse" : "flex-row";

  return (
    <View
      className={`${direction} ${gapClass} ${className || ""}`}
      style={style}
      {...props}
    />
  );
}

HStack.displayName = "HStack";
