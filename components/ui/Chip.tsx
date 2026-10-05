import React from 'react';
import { Text, TouchableOpacity, ViewStyle } from 'react-native';
import colors from '@/constants/colors';
import { getContrastTextColor, getReadableAccent } from '@/utils/colorContrast';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  // Élément avant le libellé (avatar, icône)
  left?: React.ReactNode;
  // Élément après le libellé (montant, badge)
  right?: React.ReactNode;
  // Pastille posée sur le fond de page (blanche) ou dans une carte (fond neutre)
  surface?: 'page' | 'card';
  style?: ViewStyle;
  accentColor?: string;
}

/**
 * Pastille sélectionnable : sombre quand elle est choisie (style Grassfeld).
 */
export default function Chip({
  label,
  selected = false,
  onPress,
  left,
  right,
  surface = 'page',
  style,
  accentColor = colors.textPrimary,
}: ChipProps) {
  const idleBackground = surface === 'card' ? colors.canvas : colors.surface;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: selected ? accentColor : idleBackground,
        borderWidth: 1,
        borderColor: selected ? getReadableAccent(accentColor) : colors.canvasMuted,
        borderRadius: 999,
        paddingVertical: 7,
        paddingLeft: left ? 6 : 14,
        paddingRight: 14,
        ...style,
      }}
    >
      {left}
      <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? getContrastTextColor(accentColor) : colors.textPrimary }}>
        {label}
      </Text>
      {right}
    </TouchableOpacity>
  );
}
