import React from 'react';
import { Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface DashedButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

/**
 * Bouton discret en pointillés pour ajouter un élément en fin de liste
 * (enfant, objectif…).
 */
export default function DashedButton({ label, onPress, icon = 'add', style }: DashedButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: colors.textLight + '60',
        paddingVertical: 14,
        ...style,
      }}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>{label}</Text>
    </TouchableOpacity>
  );
}
