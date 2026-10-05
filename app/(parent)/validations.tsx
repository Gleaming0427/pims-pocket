import React, { useEffect, useState } from 'react';
import { ScrollView, Alert, View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMissions } from '@/hooks/useMissions';
import { useChildren } from '@/hooks/useChildren';
import { useSwipeToHome } from '@/hooks/useSwipeToHome';
import { useAuthStore } from '@/stores/authStore';
import { useMissionStore } from '@/stores/missionStore';
import ValidationCard from '@/components/parent/ValidationCard';
import ParentArtwork from '@/components/parent/ParentArtwork';
import Card from '@/components/ui/Card';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Header from '@/components/shared/Header';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import { SplitBar, LegendRow } from '@/components/shared/SplitBar';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { onMoneyRequestsSnapshot, resolveMoneyRequest } from '@/lib/firestore';
import { formatCurrencyShort, formatRelativeDate } from '@/utils/formatters';
import { Mission, MoneyRequest, Timestamp } from '@/types';
import colors from '@/constants/colors';

type ValidationTab = 'all' | 'missions' | 'requests';

// Date d'un document Firestore, en millisecondes (0 si absente)
const millis = (t?: Timestamp | null) => (t && typeof t.toMillis === 'function' ? t.toMillis() : 0);

export default function ValidationsScreen() {
  const swipeToHome = useSwipeToHome();
  const user = useAuthStore((s) => s.user);
  const { missions, isLoading } = useMissions();
  const { children } = useChildren();
  const { completeMission, updateMissionStatus } = useMissionStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);

  const pendingMissions = missions.filter((m) => m.status === 'pending_validation');
  const pendingRequests = moneyRequests.filter((r) => r.status === 'pending');

  const [tab, setTab] = useState<ValidationTab>('all');

  const findChild = (item: { childId: string; childDocId?: string }) =>
    children.find(
      (c) => (!!c.linkedUserId && c.linkedUserId === item.childId) || c.id === item.childDocId
    );
  const getChildNameByAuthUid = (authUid: string) =>
    children.find((c) => c.linkedUserId === authUid)?.firstName ?? 'Enfant';

  // Souscription temps réel aux demandes d'argent
  useEffect(() => {
    if (!user) return;
    const unsub = onMoneyRequestsSnapshot(user.id, user.familyId!, user.role, setMoneyRequests);
    return () => unsub();
  }, [user?.id]);

  const handleApproveMission = async (missionId: string) => {
    if (loadingId) return;
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || !user) return;

    setLoadingId(missionId);
    try {
      await completeMission(missionId, mission, user.familyId!);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Mission validée !', `La récompense a été créditée.`);
    } catch {
      Alert.alert('Erreur', 'Impossible de valider la mission.');
    }
    setLoadingId(null);
  };

  const handleRejectMission = (missionId: string) => {
    Alert.alert('Refuser la mission ?', "L'enfant devra recommencer la mission.", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: async () => {
          if (loadingId) return;
          setLoadingId(missionId);
          await updateMissionStatus(missionId, 'available');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setLoadingId(null);
        },
      },
    ]);
  };

  const handleApproveRequest = (req: MoneyRequest) => {
    const childName = getChildNameByAuthUid(req.childId);
    Alert.alert(
      'Accepter la demande',
      `Verser ${formatCurrencyShort(req.amount)} à ${childName} pour : « ${req.reason} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            if (loadingId) return;
            setLoadingId(req.id);
            try {
              if (!user) return;
              await resolveMoneyRequest(req.id, req, true, user.familyId!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Demande acceptée', `${childName} a été crédité·e.`);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Erreur inconnue';
              Alert.alert('Erreur', msg);
            }
            setLoadingId(null);
          },
        },
      ]
    );
  };

  const handleRejectRequest = (req: MoneyRequest) => {
    Alert.alert('Refuser la demande ?', `Demande de ${formatCurrencyShort(req.amount)} : « ${req.reason} »`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: async () => {
          if (loadingId) return;
          setLoadingId(req.id);
          try {
            if (!user) return;
            await resolveMoneyRequest(req.id, req, false, user.familyId!);
          } catch {
            Alert.alert('Erreur', 'Impossible de refuser la demande.');
          }
          setLoadingId(null);
        },
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  const totalPending = pendingMissions.length + pendingRequests.length;
  const missionsAmount = pendingMissions.reduce((sum, m) => sum + (Number(m.reward) || 0), 0);
  const requestsAmount = pendingRequests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // File unique, des plus anciennes aux plus récentes
  type QueueItem =
    | { kind: 'mission'; id: string; at: number; mission: Mission }
    | { kind: 'request'; id: string; at: number; request: MoneyRequest };
  const queue: QueueItem[] = [
    ...(tab !== 'requests'
      ? pendingMissions.map((m) => ({
          kind: 'mission' as const,
          id: m.id,
          at: millis(m.completedAt) || millis(m.createdAt),
          mission: m,
        }))
      : []),
    ...(tab !== 'missions'
      ? pendingRequests.map((r) => ({ kind: 'request' as const, id: r.id, at: millis(r.createdAt), request: r }))
      : []),
  ].sort((a, b) => a.at - b.at);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Validations" homeButton />
      <ScrollView
        {...swipeToHome}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {totalPending === 0 ? (
          <EmptyTabCard
            illustration={<ParentArtwork name="validation" size={64} />}
            title="Tout est à jour"
            description="Aucune mission ni demande d'argent en attente. Les prochaines apparaîtront ici."
          />
        ) : (
          <>
            {/* Synthèse : ce qui attend ta réponse */}
            <Card padding={20} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                En attente de ta réponse
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {totalPending} élément{totalPending > 1 ? 's' : ''} à traiter
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 18 }}>
                <Text
                  style={{ fontSize: 34, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 }}
                >
                  {formatCurrencyShort(missionsAmount + requestsAmount)}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 8 }}>
                  à verser si tu acceptes tout
                </Text>
              </View>
              <SplitBar
                segments={[
                  { value: pendingMissions.length, color: colors.accentOrange },
                  { value: pendingRequests.length, color: colors.primary },
                ]}
                style={{ marginTop: 14, marginBottom: 12 }}
              />
              <LegendRow
                color={colors.accentOrange}
                label="Missions terminées"
                share={`${pendingMissions.length}`}
                amount={missionsAmount}
              />
              <LegendRow
                color={colors.primary}
                label="Demandes d'argent"
                share={`${pendingRequests.length}`}
                amount={requestsAmount}
              />
            </Card>

            <SegmentedControl
              value={tab}
              onChange={setTab}
              style={{ marginBottom: 14 }}
              options={[
                { value: 'all', label: 'Tout', count: totalPending },
                { value: 'missions', label: 'Missions', count: pendingMissions.length },
                { value: 'requests', label: 'Demandes', count: pendingRequests.length },
              ]}
            />

            {queue.length === 0 ? (
              <EmptyTabCard
                illustration={<ParentArtwork name="validation" size={64} />}
                title={tab === 'missions' ? 'Aucune mission à valider' : 'Aucune demande en attente'}
                description="Rien à traiter dans cette catégorie pour l'instant."
              />
            ) : (
              queue.map((item) => {
                if (item.kind === 'mission') {
                  const m = item.mission;
                  const child = findChild(m);
                  return (
                    <ValidationCard
                      key={item.id}
                      kind="mission"
                      title={m.title}
                      childName={child?.firstName ?? 'Enfant'}
                      avatarId={child?.avatarId}
                      amount={m.reward}
                      meta={m.completedAt ? formatRelativeDate(m.completedAt) : undefined}
                      note={m.description || undefined}
                      onApprove={() => handleApproveMission(m.id)}
                      onReject={() => handleRejectMission(m.id)}
                      loading={loadingId === m.id}
                    />
                  );
                }
                const r = item.request;
                const child = findChild(r);
                return (
                  <ValidationCard
                    key={item.id}
                    kind="request"
                    title="Demande d'argent"
                    childName={child?.firstName ?? 'Enfant'}
                    avatarId={child?.avatarId}
                    amount={r.amount}
                    meta={formatRelativeDate(r.createdAt)}
                    note={r.reason}
                    onApprove={() => handleApproveRequest(r)}
                    onReject={() => handleRejectRequest(r)}
                    loading={loadingId === r.id}
                  />
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
