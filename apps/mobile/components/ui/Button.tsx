import { TouchableOpacity, Text, ActivityIndicator, type ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  /** Button text */
  children: string;
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

const SIZE_STYLES: Record<ButtonSize, { paddingVertical: number; fontSize: number }> = {
  sm: { paddingY: 10, fontSize: 14 },
  md: { paddingY: 14, fontSize: 16 },
  lg: { paddingY: 16, fontSize: 16 },
};

const VARIANT_STYLES: Record<ButtonVariant, { bgColor: string; textColor: string; borderWidth?: number; borderColor?: string }> = {
  primary: { bgColor: '#000000', textColor: '#FFFFFF' },
  secondary: { bgColor: '#F3F4F6', textColor: '#111827' },
  outline: { bgColor: 'transparent', textColor: '#000000', borderWidth: 1, borderColor: '#000000' },
  ghost: { bgColor: 'transparent', textColor: '#000000' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  onPress,
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle = {
    paddingVertical: sizeStyle.paddingY,
    backgroundColor: variantStyle.bgColor,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
        <Text
          style={{
            fontSize: sizeStyle.fontSize,
            fontWeight: '600',
            color: variantStyle.textColor,
          }}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
