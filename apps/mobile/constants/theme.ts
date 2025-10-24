import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Export screen dimensions
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const colors = {
  primary: '#FF6B35',      // Orange
  secondary: '#1E3A8A',    // Blue
  success: '#2ECC71',      // Green
  danger: '#E74C3C',       // Red
  warning: '#F39C12',      // Yellow
  info: '#3498DB',         // Light Blue
  
  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    inverse: '#FFFFFF',
    disabled: '#BDC3C7',
  },
  
  border: {
    light: '#ECF0F1',
    medium: '#BDC3C7',
    dark: '#7F8C8D',
  },
  
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
    color: colors.text.primary,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
    color: colors.text.primary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.text.primary,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
