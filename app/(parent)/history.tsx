import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '@/hooks/useTransactions';
import { useMissions } from '@/hooks/useMissions';
import { useChildren } from '@/hooks/useChildren';
import { useSwipeToHome } from '@/hooks/useSwipeToHome';
import TransactionItem from '@/components/parent/TransactionItem';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import colors from '@/constants/colors';
import { formatCurrencyShort, formatRelativeDate } from '@/utils/formatters';
import { Transaction, Mission } from '@/types';

// ─── Type unifié pour la timeline ───

type TimelineEntry =
  | { _type: 'transaction'; data: Transaction }
  | { _type: 'mission'; data: Mission };

// ─── Ligne mission (format compact comme TransactionItem) ───

const MissionTimelineItem = React.memo(function MissionTimelineItem({
  mission,
  childName,
}: {
  mission: Mission;
  childName?: string;
}) {
  const statusLabels: Record<Mission['status'], string> = {
    available: 'Disponible',
    in_progress: 'En cours',
    pending_validation: 'À valider',
    completed: 'Terminée',
    expired: 'Expirée',
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: colors.accentOrange + '20',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={(mission.icon as keyof typeof Ionicons.glyphMap) || 'flash'}
          size={20}
          color={colors.accentOrange}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}
          numberOfLines={1}
        >
          {mission.title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {childName ? `${childName} · ` : ''}
          {formatRelativeDate(mission.createdAt)}
          {mission.status !== 'completed' && (
            ` · ${statusLabels[mission.status]}`
          )}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.success }}>
        +{formatCurrencyShort(mission.reward)}
      </Text>
    </View>
  );
});

// ─── Page ───

export default function HistoryScreen() {
  const swipeToHome = useSwipeToHome();
  const { children } = useChildren();

  // Le filtre doit utiliser linkedUserId (Auth UID), pas child.id (doc ID).
  // Transactions et missions référencent childId = Auth UID = linkedUserId.
  const [selectedChildAuthUid, setSelectedChildAuthUid] = useState<string | null>(null);

  // Pagination : 8 opérations affichées par défaut (pour "Tous" comme pour
  // chaque enfant), "Voir plus" relance les requêtes avec une limite +8.
  const [pageSize, setPageSize] = useState(8);

  const handleFilterChange = (authUid: string | null) => {
    setSelectedChildAuthUid(authUid);
    setPageSize(8);
  };

  const { transactions, isLoading: txLoading } = useTransactions(
    selectedChildAuthUid ?? undefined,
    pageSize
  );
  const { missions, isLoading: missionsLoading } = useMissions(
    selectedChildAuthUid ?? undefined,
    pageSize
  );

  // Fusionner transactions et missions en une timeline triée par date desc,
  // limitée à la page courante.
  const timeline = useMemo<TimelineEntry[]>(() => {
    const txEntries: TimelineEntry[] = transactions.map((tx) => ({
      _type: 'transaction' as const,
      data: tx,
    }));
    const msEntries: TimelineEntry[] = missions.map((m) => ({
      _type: 'mission' as const,
      data: m,
    }));
    return [...txEntries, ...msEntries]
      .sort(
        (a, b) => b.data.createdAt.toMillis() - a.data.createdAt.toMillis()
      )
      .slice(0, pageSize);
  }, [transactions, missions, pageSize]);

  // Il reste potentiellement des opérations si une des deux collections
  // a renvoyé exactement pageSize résultats.
  const hasMore = transactions.length >= pageSize || missions.length >= pageSize;

  // Résoudre linkedUserId → nom de l'enfant
  const getChildName = useCallback(
    (authUid: string) =>
      children.find((c) => c.linkedUserId === authUid)?.firstName ?? '',
    [children]
  );

  const renderItem = useCallback(
    ({ item }: { item: TimelineEntry }) => {
      if (item._type === 'transaction') {
        const tx = item.data;
        return (
          <Card style={{ marginBottom: 8 }} padding={12}>
            <TransactionItem
              transaction={tx}
              childName={getChildName(tx.childId)}
              showDivider={false}
            />
          </Card>
        );
      }
      const mission = item.data;
      return (
        <Card style={{ marginBottom: 8 }} padding={12}>
          <MissionTimelineItem
            mission={mission}
            childName={getChildName(mission.childId)}
          />
        </Card>
      );
    },
    [getChildName]
  );

  const keyExtractor = useCallback(
    (item: TimelineEntry) => `${item._type}_${item.data.id}`,
    []
  );

  // Chips de filtre : utilisent linkedUserId
  const childrenChips = useMemo(
    () => (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => handleFilterChange(null)}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: !selectedChildAuthUid ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: !selectedChildAuthUid ? colors.primary : colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: !selectedChildAuthUid ? '#FFF' : colors.textSecondary,
            }}
          >
            Tous
          </Text>
        </TouchableOpacity>
        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            onPress={() => handleFilterChange(child.linkedUserId!)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor:
                selectedChildAuthUid === child.linkedUserId
                  ? colors.primary
                  : colors.surface,
              borderWidth: 1,
              borderColor:
                selectedChildAuthUid === child.linkedUserId
                  ? colors.primary
                  : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color:
                  selectedChildAuthUid === child.linkedUserId
                    ? '#FFF'
                    : colors.textSecondary,
              }}
            >
              {child.firstName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [children, selectedChildAuthUid]
  );

  if (txLoading || missionsLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Historique" homeButton />
      <View style={{ flex: 1 }} {...swipeToHome}>
        <FlatList
          data={timeline}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            {childrenChips}
          </ScrollView>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📝"
            title="Aucune activité"
            description="Les transactions et missions apparaîtront ici."
          />
        }
        ListFooterComponent={
          hasMore ? (
            <View style={{ marginTop: 20 }}>
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
      </View>
    </SafeAreaView>
  );
}
