// Spacing Scale (based on 4px grid)
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

// Common screen padding
export const screenPadding = {
  horizontal: spacing[5], // 20px
} as const;

// Tab bar dimensions
export const tabBar = {
  height: 72,
  iconSize: 24,
  fabSize: 56, // Floating action button (Jual tab)
} as const;

export type Spacing = typeof spacing;
