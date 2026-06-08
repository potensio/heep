import { useTheme } from "@/context/ThemeContext";

/**
 * Color tokens for icons - matches global.css CSS variables
 * Only define colors that differ from the default foreground color
 */
const LIGHT_COLORS = {
  // Default icon color (most icons use this)
  foreground: "#1F1F1F", // foreground
  foregroundMuted: "#A3A3A3", // muted - for secondary/disabled icons
  background: "#FFFFFF",

  // Brand colors (rarely used, for external services)
  whatsapp: "#25D366",
} as const;

const DARK_COLORS = {
  foreground: "#FEFEFF", // typography-0
  foregroundMuted: "#A3A3A3", // muted
  background: "#1A1A1A",
  whatsapp: "#25D366",
} as const;

const COLORS = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
} as const;

/**
 * Hook to get theme-aware color values for icons.
 * Use this to get color values that match the current theme.
 *
 * Note: phosphor-react-native v3+ doesn't support IconContext.
 * Pass colors directly to icon components as props.
 */
export function useThemeColor() {
  const { resolvedTheme } = useTheme();
  return COLORS[resolvedTheme];
}
