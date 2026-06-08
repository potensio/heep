import { Text as RNText, TextProps } from "react-native";

type CustomTextProps = TextProps & {
  className?: string;
};

export function Text({ className, style, ...props }: CustomTextProps) {
  return (
    <RNText
      className={`font-normal${className ? ` ${className}` : ""}`}
      style={style}
      {...props}
    />
  );
}

Text.displayName = "Text";
