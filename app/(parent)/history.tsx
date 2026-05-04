import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '@/hooks/useTransactions';
import { useChildren } from '@/hooks/useChildren';
import TransactionItem from '@/components/parent/TransactionItem';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import colors from '@/constants/colors';

export default function HistoryScreen() {
  const { children } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const { transactions, isLoading } = useTransactions(selectedChildId ?? undefined);

  const getChildName = (childId: string) =>
    children.find((c) => c.id === childId)?.firstName ?? '';

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Historique" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setSelectedChildId(null)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: !selectedChildId ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: !selectedChildId ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: !selectedChildId ? '#FFF' : colors.textSecondary,
                }}
              >
                Tous
              </Text>
            </TouchableOpacity>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor:
                    selectedChildId === child.id ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    selectedChildId === child.id ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color:
                      selectedChildId === child.id ? '#FFF' : colors.textSecondary,
                  }}
                >
                  {child.firstName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {transactions.length === 0 ? (
          <EmptyState
            emoji="📝"
            title="Aucune transaction"
            description="L'historique des transactions apparaîtra ici."
          />
        ) : (
          <Card>
            {transactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                childName={getChildName(t.childId)}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
