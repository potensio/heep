import { type ReactNode } from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type ViewStyle,
} from "react-native";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  /** Button text */
  children?: string;
  /** Icon element (React element) */
  icon?: ReactNode;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional container style */
  style?: ViewStyle;
  /** Press handler */
  onPress?: () => void;
}

const SIZE_STYLES: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; fontSize: number }
> = {
  sm: { height: 36, paddingHorizontal: 16, fontSize: 14 },
  md: { height: 48, paddingHorizontal: 20, fontSize: 16 },
  lg: { height: 52, paddingHorizontal: 24, fontSize: 16 },
};

const VARIANT_STYLES: Record<
  ButtonVariant,
  {
    bgColor: string;
    textColor: string;
    borderWidth?: number;
    borderColor?: string;
  }
> = {
  primary: {
    bgColor: "#000000",
    textColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#000000",
  },
  secondary: {
    bgColor: "#F3F4F6",
    textColor: "#111827",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  outline: {
    bgColor: "transparent",
    textColor: "#000000",
    borderWidth: 1,
    borderColor: "#000000",
  },
  ghost: { bgColor: "transparent", textColor: "#000000" },
};

export function Button({
  children,
  icon,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  onPress,
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;
  const isIconOnly = icon && !children;

  const buttonStyle: ViewStyle = {
    height: sizeStyle.height,
    width: isIconOnly ? sizeStyle.height : undefined,
    paddingHorizontal: isIconOnly ? 0 : sizeStyle.paddingHorizontal,
    backgroundColor: variantStyle.bgColor,
    borderRadius: isIconOnly ? sizeStyle.height / 2 : 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: variantStyle.borderWidth,
    borderColor: variantStyle.borderColor,
    opacity: isDisabled ? 0.5 : 1,
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      disabled={isDisabled}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} />
      ) : (
        <>
          {icon && <>{icon}</>}
          {children && (
            <Text
              style={{
                fontSize: sizeStyle.fontSize,
                fontWeight: "500",
                color: variantStyle.textColor,
                marginLeft: icon ? 8 : 0,
              }}
            >
              {children}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
