import { useTheme } from '@theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useMemo } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from './text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonTextVariant = 'label' | 'body' | 'subtitle';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const sizeConfig: Record<ButtonSize, { height: number; paddingHorizontal: number; textVariant: ButtonTextVariant }> = {
  sm: { height: 40, paddingHorizontal: 16, textVariant: 'label' },
  md: { height: 48, paddingHorizontal: 20, textVariant: 'body' },
  lg: { height: 56, paddingHorizontal: 24, textVariant: 'subtitle' },
};

export function Button({
  label,
  size = 'md',
  variant = 'primary',
  leadingIcon,
  trailingIcon,
  contentStyle,
  textStyle,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const baseStyle = useMemo(() => {
    const palette = theme.colors;
    const stylesByVariant: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: 'transparent', // Using gradient instead
        borderColor: 'transparent',
      },
      secondary: {
        backgroundColor: palette.surface,
        borderColor: palette.border,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: palette.borderStrong,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
    };
    return stylesByVariant;
  }, [theme.colors]);

  const textTone = useMemo(() => {
    switch (variant) {
      case 'primary':
        return 'inverse';
      case 'secondary':
      case 'outline':
        return 'default';
      case 'ghost':
      default:
        return 'primary';
    }
  }, [variant]);

  const { height, paddingHorizontal, textVariant } = sizeConfig[size];

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      android_ripple={{ color: theme.colors.overlay }}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        {
          height,
          paddingHorizontal,
          borderRadius: theme.radii.lg,
          opacity: disabled ? 0.5 : 1, // Removed pressed opacity logic from here as we use scale
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
        },
        baseStyle[variant],
        style,
        animatedStyle,
      ]}
      {...rest}
    >
      {({ pressed }) => {
        const content = (
          <View style={[styles.content, contentStyle]}>
            {leadingIcon ? <View style={styles.icon}>{leadingIcon}</View> : null}
            {label ? (
              <AppText
                variant={textVariant}
                tone={textTone}
                weight="semibold"
                style={[styles.label, textStyle, pressed && variant === 'ghost' ? { opacity: 0.6 } : null]}
              >
                {label}
              </AppText>
            ) : children}
            {trailingIcon ? <View style={styles.icon}>{trailingIcon}</View> : null}
          </View>
        );

        if (variant === 'primary' && !disabled) {
          return (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryMuted]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: theme.radii.lg, justifyContent: 'center' }]}
            >
              {content}
            </LinearGradient>
          );
        }
        
        if (variant === 'primary' && disabled) {
           return (
            <View
              style={[
                 StyleSheet.absoluteFill, 
                 { 
                   backgroundColor: theme.colors.surfaceMuted, 
                   borderRadius: theme.radii.lg, 
                   justifyContent: 'center' 
                 }
              ]}
            >
              {content}
            </View>
           )
        }

        return content;
      }}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as ViewStyle,
  label: {
    textAlign: 'center',
  } as TextStyle,
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

