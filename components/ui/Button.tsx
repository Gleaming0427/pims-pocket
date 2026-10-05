import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import colors from '@/constants/colors';
import { getContrastTextColor } from '@/utils/colorContrast';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accentColor?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
  accentColor,
}: ButtonProps) {
  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    ...(fullWidth ? { width: '100%' } : {}),
  };

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 48 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, minHeight: 56 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: accentColor ?? colors.primary },
    secondary: { backgroundColor: accentColor ?? colors.secondary },
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: accentColor ?? colors.primary },
    danger: { backgroundColor: colors.error },
    ghost: { backgroundColor: 'transparent' },
    dark: { backgroundColor: colors.textPrimary },
    light: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.canvasMuted },
  };

  const textColors: Record<string, string> = {
    primary: accentColor ? getContrastTextColor(accentColor) : '#FFFFFF',
    secondary: accentColor ? getContrastTextColor(accentColor) : '#FFFFFF',
    outline: accentColor ? colors.textPrimary : colors.primary,
    danger: '#FFFFFF',
    ghost: accentColor ? colors.textPrimary : colors.primary,
    dark: '#FFFFFF',
    light: colors.textPrimary,
  };

  const textSizes: Record<string, TextStyle> = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        baseStyle,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textStyle?.color ?? textColors[variant]} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              {
                color: textColors[variant],
                fontWeight: '700',
                marginLeft: icon ? 8 : 0,
              },
              textSizes[size],
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
