import React from 'react';
import { View, Text } from 'react-native';
import { BadgeDefinition } from '@/types';
import colors from '@/constants/colors';

interface BadgeItemProps {
  badge: BadgeDefinition;
  earned: boolean;
  size?: 'sm' | 'lg';
}

export default function BadgeItem({ badge, earned, size = 'sm' }: BadgeItemProps) {
  const dim = size === 'sm' ? 64 : 88;
  const fontSize = size === 'sm' ? 28 : 40;
  const textSize = size === 'sm' ? 11 : 13;

  return (
    <View
      style={{
        alignItems: 'center',
        width: dim + 16,
        opacity: earned ? 1 : 0.35,
      }}
    >
      <View
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: earned ? colors.starGold + '30' : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: earned ? 2 : 0,
          borderColor: colors.starGold,
        }}
      >
        <Text style={{ fontSize }}>{earned ? badge.emoji : '🔒'}</Text>
      </View>
      <Text
        style={{
          fontSize: textSize,
          fontWeight: '600',
          color: earned ? colors.textPrimary : colors.textLight,
          textAlign: 'center',
          marginTop: 6,
        }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );
}
