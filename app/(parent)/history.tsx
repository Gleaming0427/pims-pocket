import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '@/hooks/useTransactions';
import { useMissions } from '@/hooks/useMissions';
import { useChildren } from '@/hooks/useChildren';
import { useSwipeToHome } from '@/hooks/useSwipeToHome';
import TransactionItem, { isDebitTransaction } from '@/components/parent/TransactionItem';
import MissionCard from '@/components/parent/MissionCard';
import ParentArtwork from '@/components/parent/ParentArtwork';
import Header from '@/components/shared/Header';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import LoadingScreen from '@/components/shared/LoadingScreen';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import GroupTitle from '@/components/ui/GroupTitle';
import SegmentedControl from '@/components/ui/SegmentedControl';
import colors from '@/constants/colors';
import { formatCurrencyShort } from '@/utils/formatters';
import { Transaction, Mission } from '@/types';

type HistoryTab = 'money' | 'missions';

const PAGE_SIZE = 8;

// Libellé du jour : « Aujourd'hui », « Hier », sinon « Lundi 5 octobre »
function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function timeLabel(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

type DayGroup = { key: string; label: string; transactions: Transaction[] };

export default function HistoryScreen() {
  const swipeToHome = useSwipeToHome();
  const { children } = useChildren();
  const [tab, setTab] = useState<HistoryTab>('money');

  // Le filtre utilise linkedUserId (Auth UID), pas child.id (doc ID) :
  // transactions et missions référencent childId = Auth UID = linkedUserId.
  const [selectedChildAuthUid, setSelectedChildAuthUid] = useState<string | null>(null);

  // Pagination : 8 opérations par défaut, « Voir plus » en charge 8 de plus.
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const handleFilterChange = (authUid: string | null) => {
    setSelectedChildAuthUid(authUid);
    setPageSize(PAGE_SIZE);
  };

  const { transactions, isLoading: txLoading } = useTransactions(
    selectedChildAuthUid ?? undefined,
    pageSize
  );
  const { missions, isLoading: missionsLoading } = useMissions(
    selectedChildAuthUid ?? undefined,
    pageSize
  );

  const getChildName = useCallback(
    (authUid: string) => children.find((c) => c.linkedUserId === authUid)?.firstName ?? '',
    [children]
  );

  // Argent : mouvements groupés par jour, du plus récent au plus ancien
  const dayGroups = useMemo<DayGroup[]>(() => {
    const sorted = [...transactions]
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, pageSize);
    const groups: DayGroup[] = [];
    for (const tx of sorted) {
      const date = tx.createdAt.toDate();
      const key = date.toDateString();
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.transactions.push(tx);
      else groups.push({ key, label: dayLabel(date), transactions: [tx] });
    }
    return groups;
  }, [transactions, pageSize]);

  const shownTransactions = dayGroups.reduce((n, g) => n + g.transactions.length, 0);
  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    for (const g of dayGroups) {
      for (const tx of g.transactions) {
        if (isDebitTransaction(tx)) debit += Math.abs(tx.amount);
        else credit += Math.abs(tx.amount);
      }
    }
    return { credit, debit };
  }, [dayGroups]);

  // Missions : activité, de la plus récente à la plus ancienne
  const sortedMissions = useMemo<Mission[]>(
    () =>
      [...missions]
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, pageSize),
    [missions, pageSize]
  );

  const hasMore =
    tab === 'money' ? transactions.length >= pageSize : missions.length >= pageSize;

  const activatedChildren = children.filter((c) => !!c.linkedUserId);

  if (txLoading || missionsLoading) return <LoadingScreen />;

  const header = (
    <View>
      {/* Filtre par enfant */}
      {activatedChildren.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          style={{ marginBottom: 14 }}
        >
          <Chip
            label="Tous"
            selected={!selectedChildAuthUid}
            onPress={() => handleFilterChange(null)}
          />
          {activatedChildren.map((child) => (
            <Chip
              key={child.id}
              label={child.firstName}
              selected={selectedChildAuthUid === child.linkedUserId}
              onPress={() => handleFilterChange(child.linkedUserId!)}
              left={<Avatar avatarId={child.avatarId} size={22} />}
            />
          ))}
        </ScrollView>
      )}

      <SegmentedControl
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 16 }}
        options={[
          { value: 'money', label: 'Argent' },
          { value: 'missions', label: 'Missions' },
        ]}
      />

      {/* Entrées / sorties sur les opérations affichées */}
      {tab === 'money' && shownTransactions > 0 && (
        <Card padding={16} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Entrées</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.success, marginTop: 4 }}>
                +{formatCurrencyShort(totals.credit)}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.canvasMuted, marginHorizontal: 16 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Sorties</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 4 }}>
                −{formatCurrencyShort(totals.debit)}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 10 }}>
            Sur les {shownTransactions} dernière{shownTransactions > 1 ? 's' : ''} opération
            {shownTransactions > 1 ? 's' : ''} affichée{shownTransactions > 1 ? 's' : ''}
          </Text>
        </Card>
      )}
    </View>
  );

  const footer = hasMore ? (
    <Button
      title="Voir plus"
      variant="light"
      onPress={() => setPageSize((p) => p + PAGE_SIZE)}
      style={{ marginTop: 16 }}
    />
  ) : null;

  const listStyle = {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%' as const,
    alignSelf: 'center' as const,
    flexGrow: 1,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Historique" homeButton />
      <View style={{ flex: 1 }} {...swipeToHome}>
        {tab === 'money' ? (
          <FlatList
            data={dayGroups}
            keyExtractor={(group) => group.key}
            renderItem={({ item: group }) => (
              <View>
                <GroupTitle label={group.label} />
                <Card padding={14}>
                  {group.transactions.map((tx, i) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      childName={selectedChildAuthUid ? undefined : getChildName(tx.childId)}
                      meta={timeLabel(tx.createdAt.toDate())}
                      showDivider={i < group.transactions.length - 1}
                    />
                  ))}
                </Card>
              </View>
            )}
            ListHeaderComponent={header}
            ListEmptyComponent={
              <EmptyTabCard
                illustration={<ParentArtwork name="history" size={64} />}
                title="Aucun mouvement"
                description="Les versements, récompenses et retraits apparaîtront ici."
              />
            }
            ListFooterComponent={footer}
            contentContainerStyle={listStyle}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={sortedMissions}
            keyExtractor={(mission) => mission.id}
            renderItem={({ item: mission }) => (
              <MissionCard
                mission={mission}
                childName={selectedChildAuthUid ? undefined : getChildName(mission.childId)}
              />
            )}
            ListHeaderComponent={header}
            ListEmptyComponent={
              <EmptyTabCard
                illustration={<ParentArtwork name="mission" size={64} />}
                title="Aucune mission"
                description="Les missions créées pour tes enfants apparaîtront ici."
              />
            }
            ListFooterComponent={footer}
            contentContainerStyle={listStyle}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
