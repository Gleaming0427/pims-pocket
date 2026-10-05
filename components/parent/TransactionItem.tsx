import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { formatCurrencyShort, formatRelativeDate } from '@/utils/formatters';
import colors from '@/constants/colors';

interface TransactionItemProps {
  transaction: Transaction;
  childName?: string;
  // Séparateur sous la ligne (à désactiver sur la dernière ligne d'une carte)
  showDivider?: boolean;
  // Remplace la date relative (ex. : l'heure, quand la liste est groupée par jour)
  meta?: string;
}

const typeConfig: Record<
  Transaction['type'],
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
> = {
  allowance: { icon: 'calendar', label: 'Argent de poche', color: colors.primary },
  mission_reward: { icon: 'trophy', label: 'Mission', color: colors.accentOrange },
  bonus: { icon: 'star', label: 'Bonus', color: colors.accent },
  gift: { icon: 'gift', label: 'Cadeau', color: colors.secondary },
  saving: { icon: 'wallet', label: 'Épargne', color: colors.info },
  spending: { icon: 'cart', label: 'Dépense', color: colors.error },
  request: { icon: 'hand-left', label: 'Demande', color: colors.secondary },
  penalty: { icon: 'remove-circle', label: 'Retrait', color: colors.error },
};

const FALLBACK_CONFIG = {
  icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
  label: 'Transaction',
  color: colors.textSecondary,
};

// Les transactions de retrait (penalty) sont stockées avec amount > 0
// (contrainte Firestore Rules) mais doivent s'afficher comme un débit.
// 'saving' : débit quand amount < 0 (épargne), crédit quand > 0 (remboursement).
export const isDebitTransaction = (transaction: Transaction) =>
  transaction.type === 'penalty' || transaction.type === 'spending' || transaction.amount < 0;

const TransactionItem = React.memo(function TransactionItem({
  transaction,
  childName,
  showDivider = true,
  meta,
}: TransactionItemProps) {
  const config = typeConfig[transaction.type] ?? FALLBACK_CONFIG;
  const isDebit = isDebitTransaction(transaction);
  const displayAmount = Math.abs(transaction.amount);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
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
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {[childName, meta ?? formatRelativeDate(transaction.createdAt)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '800',
            color: isDebit ? colors.textPrimary : colors.success,
            marginLeft: 8,
          }}
        >
          {isDebit ? '−' : '+'}
          {formatCurrencyShort(displayAmount)}
        </Text>
      </View>
      {/* Séparateur aligné sur le texte (après l'icône) */}
      {showDivider && (
        <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginLeft: 54 }} />
      )}
    </View>
  );
});
export default TransactionItem;
