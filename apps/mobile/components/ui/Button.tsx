import { Pressable, Text, PressableProps } from "react-native";

type ButtonVariant = "solid" | "outline" | "link";
type ButtonAction = "primary" | "secondary" | "positive" | "negative";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

type ButtonProps = PressableProps & {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  action?: ButtonAction;
  isDisabled?: boolean;
  children?: React.ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  solid: "bg-primary-500 data-[active=true]:bg-primary-600",
  outline:
    "bg-transparent border border-primary-500 data-[active=true]:bg-primary-50",
  link: "bg-transparent",
};

const actionStyles: Record<ButtonAction, string> = {
  primary: "",
  secondary:
    "bg-secondary-500 border-secondary-500 data-[active=true]:bg-secondary-600",
  positive:
    "bg-success-500 border-success-500 data-[active=true]:bg-success-600",
  negative: "bg-error-500 border-error-500 data-[active=true]:bg-error-600",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-8 px-3.5 rounded",
  sm: "h-9 px-4 rounded",
  md: "h-10 px-5 rounded-md",
  lg: "h-11 px-6 rounded-lg",
  xl: "h-12 px-7 rounded-lg",
};

export function Button({
  className,
  variant = "solid",
  size = "md",
  action = "primary",
  isDisabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const baseStyle =
    "flex-row items-center justify-center data-[disabled=true]:opacity-50";
  const variantStyle =
    action === "primary" ? variantStyles[variant] : actionStyles[action];
  const sizeStyle = variant === "link" ? "" : sizeStyles[size];

  return (
    <Pressable
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ""}`}
      style={variant === "link" ? [style, { padding: 0 }] : style}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </Pressable>
  );
}

Button.displayName = "Button";

type ButtonTextProps = { className?: string; children?: React.ReactNode };

export function ButtonText({ className, children }: ButtonTextProps) {
  return (
    <Text className={`text-white font-semibold text-base ${className || ""}`}>
      {children}
    </Text>
  );
}

ButtonText.displayName = "ButtonText";
