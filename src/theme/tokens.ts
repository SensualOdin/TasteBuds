export const palette = {
  // Restaurant Match App - Brand Style Guide
  // Primary Colors
  primary: '#D7263D', // Imperial Red - Primary action buttons, Like/Swipe Right
  primaryDark: '#8C1825', // Crimson Wine - Overlays, gradients, elevated backgrounds
  primaryLight: '#E84A5F', // Lighter red variant
  // Secondary Colors
  secondary: '#E7C880', // Soft Gold - Highlights, premium indicators
  champagneWhite: '#F2EFEA', // Champagne White - Primary text color
  // Status Colors
  success: '#10B981', // Green for success states
  warning: '#F59E0B', // Amber for warnings
  danger: '#D7263D', // Use Imperial Red for danger/errors
  // Dark Background Palette - Luxury dark mode
  neutral0: '#ffffff',
  neutral25: '#F2EFEA', // Champagne White
  neutral50: '#E5E5E5',
  neutral100: '#D4D4D4',
  neutral200: '#A3A3A3',
  neutral300: '#737373',
  neutral400: '#525252',
  neutral500: '#404040',
  neutral600: '#2A2A2A',
  neutral700: '#1F1F1F',
  neutral800: '#151518', // Velvet Black
  neutral900: '#0E0F10', // Midnight Graphite - Global app background
  overlayDark: 'rgba(140, 24, 37, 0.8)', // Crimson Wine overlay
  overlayLight: 'rgba(215, 38, 61, 0.1)', // Imperial Red tinted overlay
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
  background: palette.champagneWhite, // Champagne White background
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F8F8F8',
  surfaceElevated: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.1)',
  borderStrong: 'rgba(0, 0, 0, 0.2)',
  text: '#0E0F10', // Midnight Graphite for text
  textSecondary: '#404040',
  textMuted: '#737373',
  textInverse: palette.champagneWhite, // Champagne White on dark
  primary: palette.primary, // Imperial Red
  primaryMuted: palette.primaryLight,
  primaryContrast: palette.champagneWhite, // Champagne White text on red
  secondary: palette.secondary, // Soft Gold
  danger: palette.danger, // Imperial Red
  success: palette.success,
  warning: palette.warning,
  overlay: palette.overlayLight,
};

export const darkColors: ThemeColors = {
  // Dark mode - Luxury dark mode with brand colors
  background: palette.neutral900, // Midnight Graphite - Global app background
  backgroundSecondary: palette.neutral800, // Velvet Black
  surface: palette.neutral800, // Velvet Black
  surfaceMuted: '#1F1F1F', // Slightly lighter than Velvet Black
  surfaceElevated: palette.primaryDark, // Crimson Wine - Elevated backgrounds
  border: 'rgba(215, 38, 61, 0.2)', // Imperial Red tinted borders
  borderStrong: 'rgba(215, 38, 61, 0.4)',
  text: palette.champagneWhite, // Champagne White - Primary text color
  textSecondary: '#D4D4D4',
  textMuted: 'rgba(242, 239, 234, 0.6)', // Champagne White with opacity
  textInverse: '#0E0F10', // Midnight Graphite on light
  primary: palette.primary, // Imperial Red - Primary action buttons
  primaryMuted: palette.primaryLight,
  primaryContrast: palette.champagneWhite, // Champagne White text on red
  secondary: palette.secondary, // Soft Gold - Highlights, premium indicators
  danger: palette.danger, // Imperial Red
  success: palette.success,
  warning: palette.warning,
  overlay: palette.overlayDark, // Crimson Wine overlay
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

