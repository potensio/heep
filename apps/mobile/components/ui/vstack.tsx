import { View, ViewProps } from "react-native";
import { ReactNode } from "react";

type VStackProps = ViewProps & {
  className?: string;
  space?: "0" | "0.5" | "1" | "1.5" | "2" | "2.5" | "3" | "3.5" | "4" | "5" | "6" | "8" | "10" | "12" | "16";
  reversed?: boolean;
  children?: ReactNode;
};

/**
 * VStack - Vertical stack layout component
 * 
 * Note: React Native does not support CSS `gap` property.
 * The `space` prop is kept for API compatibility but won't add spacing.
 * 
 * For spacing between items, either:
 * 1. Add margin classes to children manually (mt-4, mt-6, etc.)
 * 2. Wrap children in components that include their own spacing
 */
export function VStack({ className, space, reversed, children, style, ...props }: VStackProps) {
  const direction = reversed ? "flex-col-reverse" : "flex-col";
  // Note: gap-{space} won't work on React Native, kept for potential web usage
  const gapClass = space ? `gap-${space}` : "";

  return (
    <View
      className={`${direction} ${gapClass} ${className || ""}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}

VStack.displayName = "VStack";
