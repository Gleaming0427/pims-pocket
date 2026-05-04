import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@/hooks/useTransactions';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { formatCurrencyShort, formatRelativeDate } from '@/utils/formatters';
import colors from '@/constants/colors';

const typeIcon: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  allowance: { icon: 'calendar', color: colors.primary },
  mission_reward: { icon: 'trophy', color: colors.accentOrange },
  bonus: { icon: 'star', color: colors.starGold },
  gift: { icon: 'gift', color: colors.piggyPink },
  saving: { icon: 'wallet', color: colors.info },
  spending: { icon: 'cart', color: colors.error },
  request: { icon: 'hand-left', color: colors.secondary },
};

export default function ChildHistoryScreen() {
  const { transactions, isLoading } = useTransactions();

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header title="Mon historique" showBack />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {transactions.length === 0 ? (
          <EmptyState
            emoji="📜"
            title="Rien pour l'instant"
            description="Ton historique apparaîtra ici quand tu recevras ou dépenseras de l'argent."
          />
        ) : (
          transactions.map((t) => {
            const config = typeIcon[t.type] ?? { icon: 'ellipse', color: colors.textLight };
            const isPositive = t.amount > 0;

            return (
              <Card
                key={t.id}
                variant="child"
                style={{
                  marginBottom: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: isPositive ? colors.success : t.type === 'saving' ? colors.info : colors.error,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
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
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.textPrimary,
                      }}
                      numberOfLines={1}
                    >
                      {t.description}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 2 }}>
                      {formatRelativeDate(t.createdAt)}
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
                    {formatCurrencyShort(t.amount)}
                  </Text>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
