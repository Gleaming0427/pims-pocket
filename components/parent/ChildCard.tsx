import React from 'react';
import { View, Text } from 'react-native';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { Child } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

interface ChildCardProps {
  child: Child;
  onPress: () => void;
  lastActivity?: string;
}

const ChildCard = React.memo(function ChildCard({ child, onPress, lastActivity }: ChildCardProps) {
  return (
    <Card onPress={onPress} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar avatarId={child.avatarId} size={56} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.textPrimary,
            }}
          >
            {child.firstName}
          </Text>
          {lastActivity && (
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {lastActivity}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: colors.primary,
            }}
          >
            {formatCurrencyShort(child.balance)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textLight,
              marginTop: 2,
            }}
          >
            Solde actuel
          </Text>
        </View>
      </View>
    </Card>
  );
});
export default ChildCard;
