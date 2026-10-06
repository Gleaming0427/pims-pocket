import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { getReadableAccent } from '@/utils/colorContrast';

interface IllustrationIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}

export default function IllustrationIcon({
  name,
  size = 64,
  color = colors.primary,
}: IllustrationIconProps) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: color + '15',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={getReadableAccent(color)} />
    </View>
  );
}
