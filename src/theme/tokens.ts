export const palette = {
  // Restaurant Match App - Brand Style Guide
  // Primary Colors
  primary: '#E11D48', // Vibrant Rose/Red - More pop than Imperial Red
  primaryDark: '#BE123C', // Rose 700
  primaryLight: '#FB7185', // Rose 400
  // Secondary Colors
  secondary: '#F59E0B', // Amber 500 - Warm Gold
  secondaryLight: '#FCD34D', // Amber 300
  champagneWhite: '#FAFAF9', // Warm White
  // Status Colors
  success: '#10B981', // Emerald 500
  warning: '#F59E0B', // Amber 500
  danger: '#EF4444', // Red 500
  // Dark Background Palette - Luxury dark mode
  neutral0: '#ffffff',
  neutral25: '#FAFAF9',
  neutral50: '#F5F5F4',
  neutral100: '#E7E5E4',
  neutral200: '#D6D3D1',
  neutral300: '#A8A29E',
  neutral400: '#78716C',
  neutral500: '#57534E',
  neutral600: '#44403C',
  neutral700: '#292524',
  neutral800: '#1C1917', // Warm Dark
  neutral900: '#0C0A09', // Almost Black
  overlayDark: 'rgba(12, 10, 9, 0.8)',
  overlayLight: 'rgba(225, 29, 72, 0.1)',
};

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    primary: 'PlusJakartaSans-Regular',
    primaryMedium: 'PlusJakartaSans-Medium',
    primarySemiBold: 'PlusJakartaSans-SemiBold',
    primaryBold: 'PlusJakartaSans-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    '2xl': 40,
    '3xl': 44,
  },
  letterSpacing: {
    tight: -0.4,
    normal: 0,
    wide: 0.2,
  },
} as const;

export type ThemeColors = {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryMuted: string;
  primaryContrast: string;
  secondary: string;
  danger: string;
  success: string;
  warning: string;
  overlay: string;
};

export const lightColors: ThemeColors = {
  // Light mode - clean and elegant
  background: '#FAFAF9', // Warm Stone 50
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F4',
  surfaceElevated: '#FFFFFF',
  border: '#E7E5E4',
  borderStrong: '#D6D3D1',
  text: '#1C1917', // Warm Dark
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  textInverse: '#FAFAF9',
  primary: palette.primary,
  primaryMuted: palette.primaryLight,
  primaryContrast: '#FFFFFF',
  secondary: palette.secondary,
  danger: palette.danger,
  success: palette.success,
  warning: palette.warning,
  overlay: palette.overlayLight,
};

export const darkColors: ThemeColors = {
  // Dark mode - Luxury dark mode with brand colors
  background: '#0C0A09', // Warm Black
  backgroundSecondary: '#1C1917',
  surface: '#1C1917', // Dark Stone 900
  surfaceMuted: '#292524', // Dark Stone 800
  surfaceElevated: '#292524',
  border: '#292524',
  borderStrong: '#44403C',
  text: '#FAFAF9', // Warm White
  textSecondary: '#A8A29E', // Warm Gray
  textMuted: '#57534E',
  textInverse: '#1C1917',
  primary: palette.primary,
  primaryMuted: palette.primaryDark,
  primaryContrast: '#FFFFFF',
  secondary: palette.secondary,
  danger: palette.danger,
  success: palette.success,
  warning: palette.warning,
  overlay: palette.overlayDark,
};

export const shadows = {
  xs: {
    shadowColor: 'rgba(215, 38, 61, 0.1)', // Subtle Imperial Red glow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: 'rgba(215, 38, 61, 0.15)', // Imperial Red glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  md: {
    shadowColor: 'rgba(140, 24, 37, 0.25)', // Crimson Wine glow for depth
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export type ThemeSpacing = typeof spacing;
export type ThemeRadii = typeof radii;
export type ThemeTypography = typeof typography;

