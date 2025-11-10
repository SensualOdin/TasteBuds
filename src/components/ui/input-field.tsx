import { useTheme } from '@theme';
import { forwardRef, ReactNode, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { Icon } from './icon';
import { AppText } from './text';

type InputVariant = 'default' | 'filled';

type InputFieldProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  variant?: InputVariant;
  secureToggle?: boolean;
};

export const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      helperText,
      errorText,
      leadingIcon,
      trailingIcon,
      containerStyle,
      inputStyle,
      variant = 'default',
      secureTextEntry,
      secureToggle = false,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme();
    const [obscured, setObscured] = useState<boolean>(!!secureTextEntry);

    const palette = theme.colors;
    const isError = Boolean(errorText);

    const backgroundStyles: Record<InputVariant, ViewStyle> = {
      default: {
        backgroundColor: palette.surface,
        borderColor: palette.border,
      },
      filled: {
        backgroundColor: palette.surfaceMuted,
        borderColor: palette.border,
      },
    };

    return (
      <View style={containerStyle}>
        {label ? (
          <AppText variant="label" tone={isError ? 'danger' : 'secondary'} style={styles.label}>
            {label}
          </AppText>
        ) : null}
        <View
          style={[
            styles.inputWrapper,
            backgroundStyles[variant],
            {
              borderRadius: theme.radii.lg,
              borderWidth: 1,
              paddingHorizontal: theme.spacing.md,
              minHeight: 56,
            },
            isError ? { borderColor: palette.danger } : null,
          ]}
        >
          {leadingIcon ? <View style={styles.icon}>{leadingIcon}</View> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={palette.textMuted}
            secureTextEntry={obscured}
            style={[
              styles.input,
              {
                color: palette.text,
                fontSize: theme.typography.fontSize.md,
                fontFamily: theme.typography.fontFamily.primary,
              },
              inputStyle,
            ]}
            {...rest}
          />
          {secureToggle ? (
            <Icon
              name={obscured ? 'visibility-off' : 'visibility'}
              size={22}
              tone="muted"
              onPress={() => setObscured((prev) => !prev)}
            />
          ) : null}
          {!secureToggle && trailingIcon ? <View style={styles.icon}>{trailingIcon}</View> : null}
        </View>
        {helperText && !isError ? (
          <AppText tone="muted" variant="caption" style={styles.helper}>
            {helperText}
          </AppText>
        ) : null}
        {isError ? (
          <AppText tone="danger" variant="caption" style={styles.helper}>
            {errorText}
          </AppText>
        ) : null}
      </View>
    );
  },
);

InputField.displayName = 'InputField';

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
  },
  helper: {
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

