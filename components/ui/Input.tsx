import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { getReadableAccent } from '@/utils/colorContrast';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  accentColor?: string;
}

export default function Input({
  label,
  error,
  icon,
  isPassword,
  containerStyle,
  accentColor = colors.primary,
  ...props
}: InputProps) {
  const focusColor = getReadableAccent(accentColor);
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[{ marginBottom: 16, width: '100%' }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: error
            ? colors.error
            : focused
              ? focusColor
              : colors.canvasMuted,
          paddingHorizontal: 14,
          minHeight: 52,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? colors.error : focused ? accentColor : colors.textLight}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          selectionColor={focusColor}
          {...props}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={colors.textLight}
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.textPrimary,
            paddingVertical: 12,
          }}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
