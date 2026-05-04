import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { formatCurrencyShort, formatRelativeDate } from '@/utils/formatters';
import colors from '@/constants/colors';

interface TransactionItemProps {
  transaction: Transaction;
  childName?: string;
}

const typeConfig: Record<
  Transaction['type'],
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
> = {
  allowance: { icon: 'calendar', label: 'Argent de poche', color: colors.primary },
  mission_reward: { icon: 'trophy', label: 'Mission', color: colors.accentOrange },
  bonus: { icon: 'star', label: 'Bonus', color: colors.accent },
  gift: { icon: 'gift', label: 'Cadeau', color: colors.piggyPink },
  saving: { icon: 'wallet', label: 'Épargne', color: colors.info },
  spending: { icon: 'cart', label: 'Dépense', color: colors.error },
  request: { icon: 'hand-left', label: 'Demande', color: colors.secondary },
};

export default function TransactionItem({
  transaction,
  childName,
}: TransactionItemProps) {
  const config = typeConfig[transaction.type];
  const isPositive = transaction.amount > 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: config.color + '20',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}
          numberOfLines={1}
        >
          {transaction.description || config.label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {childName ? `${childName} · ` : ''}
          {formatRelativeDate(transaction.createdAt)}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: isPositive ? colors.success : colors.error,
        }}
      >
        {isPositive ? '+' : ''}
        {formatCurrencyShort(transaction.amount)}
      </Text>
    </View>
  );
}
