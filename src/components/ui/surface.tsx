import { useTheme } from '@theme';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

type SurfaceVariant = 'default' | 'muted' | 'elevated' | 'transparent';
type SurfacePadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SurfaceRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

type SurfaceProps = ViewProps & {
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
  radius?: SurfaceRadius;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  border?: boolean;
};

export function Surface({
  variant = 'default',
  padding = 'md',
  radius = 'lg',
  style,
  children,
  border = false,
  ...rest
}: SurfaceProps) {
  const theme = useTheme();

  const backgroundMap: Record<SurfaceVariant, string> = {
    default: theme.colors.surface,
    muted: theme.colors.surfaceMuted,
    elevated: theme.colors.surfaceElevated,
    transparent: 'transparent',
  };

  const paddingValue = padding === 'none' ? 0 : theme.spacing[padding];

  const baseStyle: ViewStyle = {
    backgroundColor: backgroundMap[variant],
    borderRadius: theme.radii[radius],
    padding: paddingValue,
    borderWidth: border ? StyleSheet.hairlineWidth : 0,
    borderColor: border ? theme.colors.border : 'transparent',
  };

  const elevationStyle = variant === 'elevated' ? theme.shadows.sm : null;

  return (
    <View style={[styles.surface, baseStyle, elevationStyle, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    width: '100%',
  },
});

