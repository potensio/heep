import { useEffect } from "react";
import { View, ViewProps, Appearance } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export type ModeType = "light" | "dark" | "system";

export function GluestackUIProvider({
  mode = "light",
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps["style"];
}) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Set the color scheme for NativeWind
    Appearance.setColorScheme(resolvedTheme);
  }, [resolvedTheme]);

  return (
    <View
      style={props.style}
      className={`flex-1 bg-background ${resolvedTheme === "dark" ? "dark" : ""}`}
    >
      {props.children}
    </View>
  );
}
