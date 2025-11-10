export const palette = {
  primary: '#f2590d',
  primaryDark: '#d44805',
  primaryLight: '#ff7a32',
  secondary: '#f20d0d',
  success: '#16a34a',
  warning: '#facc15',
  danger: '#ef4444',
  neutral0: '#ffffff',
  neutral25: '#fdfbfa',
  neutral50: '#f8f6f5',
  neutral100: '#f1edea',
  neutral200: '#e4dbd4',
  neutral300: '#d0c1b7',
  neutral400: '#a89281',
  neutral500: '#7b6556',
  neutral600: '#5c4b3f',
  neutral700: '#3d312a',
  neutral800: '#221610',
  neutral900: '#121212',
  overlayDark: 'rgba(0, 0, 0, 0.55)',
  overlayLight: 'rgba(18, 13, 11, 0.12)',
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
  danger: string;
  success: string;
  warning: string;
  overlay: string;
};

export const lightColors: ThemeColors = {
  background: palette.neutral50,
  backgroundSecondary: palette.neutral25,
  surface: palette.neutral0,
  surfaceMuted: '#f5efeb',
  surfaceElevated: '#ffffff',
  border: 'rgba(22, 15, 12, 0.08)',
  borderStrong: 'rgba(22, 15, 12, 0.18)',
  text: '#1a1512',
  textSecondary: '#5c4b3f',
  textMuted: '#9a8678',
  textInverse: palette.neutral0,
  primary: palette.primary,
  primaryMuted: palette.primaryLight,
  primaryContrast: palette.neutral0,
  danger: palette.danger,
  success: palette.success,
  warning: palette.warning,
  overlay: palette.overlayLight,
};

export const darkColors: ThemeColors = {
  background: palette.neutral900,
  backgroundSecondary: '#1a100b',
  surface: palette.neutral800,
  surfaceMuted: '#2c1f18',
  surfaceElevated: '#33231b',
  border: 'rgba(255, 241, 231, 0.08)',
  borderStrong: 'rgba(255, 241, 231, 0.16)',
  text: '#f2eeeb',
  textSecondary: '#d6c4ba',
  textMuted: 'rgba(255, 241, 231, 0.6)',
  textInverse: palette.neutral900,
  primary: palette.primaryLight,
  primaryMuted: '#f07d3d',
  primaryContrast: palette.neutral900,
  danger: palette.danger,
  success: palette.success,
  warning: palette.warning,
  overlay: palette.overlayDark,
};

export const shadows = {
  xs: {
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  md: {
    shadowColor: 'rgba(0,0,0,0.16)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export type ThemeSpacing = typeof spacing;
export type ThemeRadii = typeof radii;
export type ThemeTypography = typeof typography;

