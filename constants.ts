// Brand Colors - BantuJual
export const colors = {
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    500: "#155DFC",
    600: "#1E4AF6",
    700: "#1D3ED1",
  },
  accent: {
    neon: "#c5e302",
    neonLight: "#BBF451",
    neonDark: "#7CCF00",
    red: "#FB2C36",
    orange: "#F54802",
    yellow: "#F9F906",
  },
  neutral: {
    900: "#0A0A0A",
    800: "#101828",
    700: "#364153",
    600: "#666666",
    400: "#9CA3AF",
    300: "#D1D5DB",
    200: "#E5E7EB",
    100: "#F3F4F6",
    0: "#FFFFFF",
  },
  background: {
    main: "#F9F2E6", // Broken white / coklat
  },
  tabBar: {
    active: "#101828",
    inactive: "#666666",
    background: "#FFFFFF",
    border: "#E5E7EB",
  },
} as const;

export type Colors = typeof colors;

// Spacing Scale
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const screenPadding = {
  horizontal: spacing[5],
} as const;

export const tabBar = {
  height: 72,
  iconSize: 24,
  fabSize: 56,
} as const;

export type Spacing = typeof spacing;

// Theme colors for light/dark mode (backward compatibility)
export const Colors = {
  light: {
    text: colors.neutral[900],
    background: colors.neutral[0],
    tint: colors.primary[500],
    icon: colors.neutral[600],
    tabIconDefault: colors.neutral[400],
    tabIconSelected: colors.primary[500],
  },
  dark: {
    text: colors.neutral[0],
    background: colors.neutral[900],
    tint: colors.primary[500],
    icon: colors.neutral[400],
    tabIconDefault: colors.neutral[600],
    tabIconSelected: colors.primary[500],
  },
} as const;
