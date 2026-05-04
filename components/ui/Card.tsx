import React from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  variant?: 'default' | 'child';
}

export default function Card({
  children,
  onPress,
  style,
  padding = 16,
  variant = 'default',
}: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: variant === 'child' ? colors.childBg : colors.surface,
    borderRadius: 20,
    padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}
