import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import Button from '@/components/ui/Button';
import { formatCurrencyShort, formatRelativeDate } from '@/utils/formatters';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

const typeIcon: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  allowance: { icon: 'calendar', color: colors.primary },
  mission_reward: { icon: 'trophy', color: colors.accentOrange },
  bonus: { icon: 'star', color: colors.starGold },
  gift: { icon: 'gift', color: colors.secondary },
  saving: { icon: 'wallet', color: colors.info },
  spending: { icon: 'cart', color: colors.error },
  request: { icon: 'hand-left', color: colors.secondary },
};

const TransactionRow = React.memo(function TransactionRow({
  description, createdAt, type, amount,
}: {
  description: string;
  createdAt: Date | import('@/types').Timestamp;
  type: string;
  amount: number;
}) {
  const config = useMemo(
    () => typeIcon[type] ?? { icon: 'ellipse' as const, color: colors.textLight },
    [type]
  );
  const isPositive = amount > 0;
  const formattedDate = useMemo(() => formatRelativeDate(createdAt), [createdAt]);
  const formattedAmount = useMemo(() => formatCurrencyShort(amount), [amount]);

  return (
    <Card
      variant="child"
      style={{
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: isPositive ? colors.success : type === 'saving' ? colors.info : colors.error,
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
            style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}
            numberOfLines={1}
          >
            {description}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 2 }}>
            {formattedDate}
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
          {formattedAmount}
        </Text>
      </View>
    </Card>
  );
});

export default function ChildHistoryScreen() {
    const accent = useChildThemeStore((s) => s.accent);
const user = useAuthStore((s) => s.user);

  // Pagination : 8 opérations affichées, « Voir plus » relance la requête (+8)
  const [pageSize, setPageSize] = useState(8);

  // Filtrer par le propre UID de l'enfant : requis par les règles Firestore
  const { transactions, isLoading } = useTransactions(user?.id, pageSize);

  const hasMore = transactions.length >= pageSize;

  const renderItem = useCallback(
    ({ item }: { item: (typeof transactions)[number] }) => (
      <TransactionRow
        description={item.description}
        createdAt={item.createdAt}
        type={item.type}
        amount={item.amount}
      />
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: (typeof transactions)[number]) => item.id,
    []
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header title="Mon historique" showBack />
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <EmptyState
            emoji="📜"
            title="Rien pour l'instant"
            description="Ton historique apparaîtra ici quand tu recevras ou dépenseras de l'argent."
          />
        }
        ListFooterComponent={
          hasMore ? (
            <View style={{ marginTop: 16 }}>
              <Button
                title="Voir plus"
                variant="outline"
                onPress={() => setPageSize((p) => p + 8)}
              />
            </View>
          ) : null
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
          flexGrow: 1,
        }}
        windowSize={7}
        maxToRenderPerBatch={15}
        removeClippedSubviews
        initialNumToRender={10}
      />
    </SafeAreaView>
  );
}
