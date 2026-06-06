import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme as useNativeColorScheme, Appearance } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useNativeColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  const resolvedTheme: "light" | "dark" = mode === "system" 
    ? (systemColorScheme ?? "light") 
    : mode;

  useEffect(() => {
    // Update Appearance for NativeWind
    Appearance.setColorScheme(resolvedTheme);
  }, [resolvedTheme]);

  const toggleTheme = () => {
    setMode((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "light";
      return resolvedTheme === "dark" ? "light" : "dark";
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
