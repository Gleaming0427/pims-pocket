import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import { Child } from '@/types';
import avatars from '@/constants/avatars';
import { formatCurrencyShort, allowancePeriodLabel } from '@/utils/formatters';
import colors from '@/constants/colors';

interface ChildCardProps {
  child: Child;
  onPress: () => void;
  // Missions à faire ou en cours pour cet enfant
  activeMissions?: number;
}

const ChildCard = React.memo(function ChildCard({ child, onPress, activeMissions = 0 }: ChildCardProps) {
  const avatar = avatars.find((a) => a.id === child.avatarId) ?? avatars[0];
  const saved = Number(child.totalSaved) || 0;

  const details = [
    activeMissions > 0
      ? `${activeMissions} mission${activeMissions > 1 ? 's' : ''} en cours`
      : 'Aucune mission en cours',
    child.weeklyAllowance > 0
      ? `${formatCurrencyShort(child.weeklyAllowance)}${allowancePeriodLabel(child.allowanceFrequency, true)}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card onPress={onPress} padding={14} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: avatar.color + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 24 }}>{avatar.emoji}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
            {child.firstName}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}
          >
            {details}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
            {formatCurrencyShort(child.balance)}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
            {saved > 0 ? `+ ${formatCurrencyShort(saved)} épargnés` : 'disponible'}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textLight}
          style={{ marginLeft: 6 }}
        />
      </View>
    </Card>
  );
});
export default ChildCard;
