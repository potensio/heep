import { Text as RNText, TextProps } from "react-native";

type CustomTextProps = TextProps & { className?: string };

export function Text({ className, ...props }: CustomTextProps) {
  return <RNText className={className} {...props} />;
}

Text.displayName = "Text";
