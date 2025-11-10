import { AppTheme, useTheme } from '@theme';
import { useMemo } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

type TextVariant =
  | 'display'
  | 'headline'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'label'
  | 'caption';

type TextTone = 'default' | 'secondary' | 'muted' | 'inverse' | 'primary' | 'danger' | 'success';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

type AppTextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: TextWeight;
  align?: TextStyle['textAlign'];
};

const createVariantStyles = (theme: AppTheme): Record<TextVariant, TextStyle> => ({
  display: {
    fontFamily: theme.typography.fontFamily.primaryBold,
    fontSize: theme.typography.fontSize['3xl'],
    lineHeight: theme.typography.lineHeight['3xl'],
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  headline: {
    fontFamily: theme.typography.fontFamily.primaryBold,
    fontSize: theme.typography.fontSize['2xl'],
    lineHeight: theme.typography.lineHeight['2xl'],
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  title: {
    fontFamily: theme.typography.fontFamily.primarySemiBold,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.primaryMedium,
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  body: {
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  label: {
    fontFamily: theme.typography.fontFamily.primarySemiBold,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  caption: {
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
});

const weightToFamily = (theme: AppTheme, weight: TextWeight): string => {
  switch (weight) {
    case 'medium':
      return theme.typography.fontFamily.primaryMedium;
    case 'semibold':
      return theme.typography.fontFamily.primarySemiBold;
    case 'bold':
      return theme.typography.fontFamily.primaryBold;
    default:
      return theme.typography.fontFamily.primary;
  }
};

const toneToColor = (theme: AppTheme, tone: TextTone): string => {
  switch (tone) {
    case 'secondary':
      return theme.colors.textSecondary;
    case 'muted':
      return theme.colors.textMuted;
    case 'inverse':
      return theme.colors.textInverse;
    case 'primary':
      return theme.colors.primary;
    case 'danger':
      return theme.colors.danger;
    case 'success':
      return theme.colors.success;
    default:
      return theme.colors.text;
  }
};

export function AppText({
  variant = 'body',
  tone = 'default',
  weight = 'regular',
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  const variantStyles = useMemo(() => createVariantStyles(theme), [theme]);

  const computedStyle: TextStyle = {
    ...variantStyles[variant],
    color: toneToColor(theme, tone),
    textAlign: align,
    fontFamily: weightToFamily(theme, weight),
  };

  return (
    <RNText style={[computedStyle, style]} {...rest}>
      {children}
    </RNText>
  );
}

