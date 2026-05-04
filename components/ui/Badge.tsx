import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import colors from '@/constants/colors';

interface BadgeProps {
  count?: number;
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Badge({
  count,
  color = colors.error,
  size = 'sm',
  style,
}: BadgeProps) {
  if (count !== undefined && count <= 0) return null;

  const dimensions = size === 'sm' ? 20 : 24;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View
      style={[
        {
          backgroundColor: color,
          borderRadius: dimensions / 2,
          minWidth: dimensions,
          height: dimensions,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        },
        style,
      ]}
    >
      {count !== undefined && (
        <Text
          style={{
            color: '#FFFFFF',
            fontSize,
            fontWeight: '700',
          }}
        >
          {count > 99 ? '99+' : count}
        </Text>
      )}
    </View>
  );
}
