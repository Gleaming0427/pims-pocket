import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/shared/Header';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import TransactionItem, { isDebitTransaction } from '@/components/parent/TransactionItem';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import GroupTitle from '@/components/ui/GroupTitle';
import { formatCurrencyShort } from '@/utils/formatters';
import { Transaction } from '@/types';
import colors from '@/constants/colors';

const PAGE_SIZE = 8;

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}

export default function ChildHistoryScreen() {
  const user = useAuthStore((state) => state.user);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const { transactions, isLoading, error } = useTransactions(user?.id, pageSize);
  const groups = useMemo(() => {
    const result: { key: string; label: string; transactions: Transaction[] }[] = [];
    const sorted = [...transactions].sort((first, second) => second.createdAt.toMillis() - first.createdAt.toMillis());
    for (const transaction of sorted) {
      const date = transaction.createdAt.toDate();
      const key = date.toDateString();
      const last = result[result.length - 1];
      if (last?.key === key) last.transactions.push(transaction);
      else result.push({ key, label: dayLabel(date), transactions: [transaction] });
    }
    return result;
  }, [transactions]);
  const totals = useMemo(() => transactions.reduce((sum, transaction) => {
    if (isDebitTransaction(transaction)) sum.debit += Math.abs(transaction.amount);
    else sum.credit += Math.abs(transaction.amount);
    return sum;
  }, { credit: 0, debit: 0 }), [transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Mon historique" showBack />
      <FlatList
        data={groups}
        keyExtractor={(group) => group.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center', flexGrow: 1 }}
        ListHeaderComponent={
          <View>
            {!!error && (
              <EmptyTabCard emoji="☁️" title="Chargement interrompu" description="Impossible de récupérer tes dernières opérations. Réessaie dans un instant." />
            )}
            {transactions.length > 0 && (
              <Card padding={20}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Mes mouvements</Text>
                <View style={{ flexDirection: 'row', marginTop: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Entrées</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.success, marginTop: 4 }}>
                      +{formatCurrencyShort(totals.credit)}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.canvasMuted, marginHorizontal: 16 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Sorties</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 4 }}>
                      −{formatCurrencyShort(totals.debit)}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 12 }}>
                  Sur les {transactions.length} dernières opérations affichées, épargne comprise.
                </Text>
              </Card>
            )}
          </View>
        }
        renderItem={({ item: group }) => (
          <View>
            <GroupTitle label={group.label} />
            <Card padding={14}>
              {group.transactions.map((transaction, index) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  meta={transaction.createdAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  showDivider={index < group.transactions.length - 1}
                />
              ))}
            </Card>
          </View>
        )}
        ListEmptyComponent={!isLoading && !error ? (
          <EmptyTabCard emoji="📝" title="Pas encore de mouvement" description="Ton argent de poche, tes récompenses et tes dépenses apparaîtront ici." />
        ) : null}
        ListFooterComponent={isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.textPrimary} accessibilityLabel="Chargement de l’historique" />
        ) : transactions.length >= pageSize ? (
          <Button title="Voir plus" variant="light" onPress={() => setPageSize((previous) => previous + PAGE_SIZE)} style={{ marginTop: 16 }} />
        ) : null}
      />
    </SafeAreaView>
  );
}
