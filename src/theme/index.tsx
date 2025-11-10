import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

import {
  darkColors,
  lightColors,
  palette,
  radii,
  shadows,
  spacing,
  ThemeColors,
  ThemeRadii,
  ThemeSpacing,
  ThemeTypography,
  typography,
} from './tokens';

export type ThemeMode = 'light' | 'dark';

export type AppTheme = {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radii: ThemeRadii;
  typography: ThemeTypography;
  shadows: typeof shadows;
  palette: typeof palette;
};

export const lightTheme: AppTheme = {
  colors: lightColors,
  spacing,
  radii,
  typography,
  shadows,
  palette,
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  spacing,
  radii,
  typography,
  shadows,
  palette,
};

type ThemeContextValue = {
  theme: AppTheme;
  colorMode: ThemeMode;
  setColorMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  initialMode?: ThemeMode;
};

const resolveMode = (mode: ColorSchemeName | ThemeMode | null | undefined): ThemeMode =>
  mode === 'dark' ? 'dark' : 'light';

export function AppThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [colorMode, setColorMode] = useState<ThemeMode>(resolveMode(initialMode));

  useEffect(() => {
    if (!systemColorScheme) {
      return;
    }
    const nextMode = resolveMode(systemColorScheme);
    if (nextMode !== colorMode) {
      // Updating local color mode in response to OS theme changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColorMode(nextMode);
    }
  }, [colorMode, systemColorScheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = colorMode === 'dark' ? darkTheme : lightTheme;
    return {
      theme,
      colorMode,
      setColorMode,
    };
  }, [colorMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
};

export const useTheme = () => useAppTheme().theme;

export { palette,radii, spacing, typography } from './tokens';

