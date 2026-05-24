export type ColorPalette = {
  background: string;
  surface: string;
  surfaceHighlight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryGlow: string;
  border: string;
  error: string;
  success: string;
};

export const lightColors: ColorPalette = {
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceHighlight: "#F4F4F5",
  textPrimary: "#09090B",
  textSecondary: "#71717A",
  textMuted: "#A1A1AA",
  primary: "#E11D48",
  primaryGlow: "rgba(225, 29, 72, 0.2)",
  border: "#E4E4E7",
  error: "#EF4444",
  success: "#10B981",
};

export const darkColors: ColorPalette = {
  background: "#09090B",
  surface: "#18181B",
  surfaceHighlight: "#27272A",
  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textMuted: "#52525B",
  primary: "#F43F5E",
  primaryGlow: "rgba(244, 63, 94, 0.3)",
  border: "#27272A",
  error: "#F87171",
  success: "#34D399",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};
