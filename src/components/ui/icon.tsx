import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@theme';
import { ComponentProps } from 'react';
import { StyleProp, TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type BaseIconProps = Omit<ComponentProps<typeof MaterialIcons>, 'name' | 'size' | 'color'>;
type IconTone = 'default' | 'secondary' | 'muted' | 'inverse' | 'primary' | 'danger' | 'success';

type IconProps = BaseIconProps & {
  name: MaterialIconName;
  size?: number;
  tone?: IconTone;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 24, tone = 'default', color, style, ...rest }: IconProps) {
  const theme = useTheme();

  const resolvedColor = color
    ? color
    : tone === 'primary'
    ? theme.colors.primary
    : tone === 'inverse'
    ? theme.colors.textInverse
    : tone === 'secondary'
    ? theme.colors.textSecondary
    : tone === 'muted'
    ? theme.colors.textMuted
    : tone === 'danger'
    ? theme.colors.danger
    : tone === 'success'
    ? theme.colors.success
    : theme.colors.text;

  return (
    <MaterialIcons
      name={name}
      size={size}
      color={resolvedColor}
      style={style}
      {...rest}
    />
  );
}

