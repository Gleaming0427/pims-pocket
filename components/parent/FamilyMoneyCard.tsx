import React from 'react';
import { View, Text } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import MoneySplitCard from '@/components/shared/MoneySplitCard';
import { Child } from '@/types';
import colors from '@/constants/colors';

interface FamilyMoneyCardProps {
  children: Child[];
}

const MAX_AVATARS = 3;

/**
 * Vue d'ensemble de l'argent des enfants (accueil parent).
 */
export default function FamilyMoneyCard({ children }: FamilyMoneyCardProps) {
  const available = children.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
  const saved = children.reduce((sum, c) => sum + (Number(c.totalSaved) || 0), 0);
  const distributed = children.reduce((sum, c) => sum + (Number(c.totalEarned) || 0), 0);

  const avatarStack =
    children.length > 0 ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.canvas,
          borderRadius: 999,
          paddingVertical: 3,
          paddingLeft: 3,
          paddingRight: children.length > MAX_AVATARS ? 8 : 3,
        }}
      >
        {children.slice(0, MAX_AVATARS).map((child, i) => (
          <View
            key={child.id}
            style={{
              marginLeft: i === 0 ? 0 : -8,
              borderWidth: 2,
              borderColor: colors.canvas,
              borderRadius: 999,
            }}
          >
            <Avatar avatarId={child.avatarId} size={26} />
          </View>
        ))}
        {children.length > MAX_AVATARS && (
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginLeft: 4 }}>
            +{children.length - MAX_AVATARS}
          </Text>
        )}
      </View>
    ) : null;

  return (
    <MoneySplitCard
      title="Tirelires de la famille"
      subtitle={
        children.length > 0
          ? `${children.length} enfant${children.length > 1 ? 's' : ''} · en temps réel`
          : 'Aucun enfant pour le moment'
      }
      headerRight={avatarStack}
      available={available}
      saved={saved}
      total={distributed}
      totalLabel="Distribué au total"
      availableColor={colors.primary}
      savedColor={colors.secondary}
    />
  );
}
