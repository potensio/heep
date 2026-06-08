import { Platform, View, TextInput, TextInputProps, ViewProps } from "react-native";

type InputVariant = "outline" | "underlined" | "rounded";
type InputSize = "sm" | "md" | "lg" | "xl";

type InputProps = {
  className?: string;
  variant?: InputVariant;
  size?: InputSize;
  isInvalid?: boolean;
  isDisabled?: boolean;
  children?: React.ReactNode;
};

const variantStyles: Record<InputVariant, string> = {
  outline: "border border-outline-200 bg-background-0 rounded-full px-3",
  underlined: "border-b border-outline-200 bg-transparent",
  rounded: "border border-outline-200 bg-background-0 rounded-full px-4",
};

const sizeStyles: Record<InputSize, string> = {
  sm: "h-9",
  md: "h-10",
  lg: "h-[44px]",
  xl: "h-12",
};

export function Input({
  className,
  variant = "outline",
  size = "md",
  isInvalid,
  isDisabled,
  children,
}: InputProps) {
  const baseStyle = "flex-row items-center";
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const invalidStyle = isInvalid ? "border-error-500" : "";
  const disabledStyle = isDisabled ? "opacity-50" : "";

  return (
    <View
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${invalidStyle} ${disabledStyle} ${className || ""}`}
    >
      {children}
    </View>
  );
}

Input.displayName = "Input";

type InputFieldProps = TextInputProps & { className?: string };

export function InputField({ className, style, ...props }: InputFieldProps) {
  return (
    <TextInput
      className={`flex-1 text-foreground text-base bg-transparent ${className || ""}`}
      placeholderTextColor="rgb(var(--color-muted))"
      style={[
        Platform.select({
          ios: { paddingVertical: 0 },
          android: {
            includeFontPadding: false,
            textAlignVertical: "center" as const,
          },
        }),
        style,
      ]}
      {...props}
    />
  );
}

InputField.displayName = "InputField";

type InputSlotProps = ViewProps & { className?: string };

export function InputSlot({ className, ...props }: InputSlotProps) {
  return (
    <View
      className={`justify-center items-center ${className || ""}`}
      {...props}
    />
  );
}

InputSlot.displayName = "InputSlot";

type InputIconProps = {
  as: React.ElementType;
  className?: string;
};

export function InputIcon({ as: Icon, className }: InputIconProps) {
  return <Icon className={`w-4 h-4 ${className || ""}`} />;
}

InputIcon.displayName = "InputIcon";
