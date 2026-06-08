import { createContext, useContext, useEffect, ReactNode } from "react";
import { Appearance } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Force light mode - ignore system preference
  const resolvedTheme: "light" | "dark" = "light";

  useEffect(() => {
    // Force light mode for NativeWind
    Appearance.setColorScheme("light");
  }, []);

  return (
    <ThemeContext.Provider value={{ mode: "light", resolvedTheme: "light", setMode: () => {}, toggleTheme: () => {} }}>
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
