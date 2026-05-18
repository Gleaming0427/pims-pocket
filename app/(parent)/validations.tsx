import React, { useEffect, useState } from 'react';
import { ScrollView, Alert, View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMissions } from '@/hooks/useMissions';
import { useChildren } from '@/hooks/useChildren';
import { useAuthStore } from '@/stores/authStore';
import { useMissionStore } from '@/stores/missionStore';
import ValidationCard from '@/components/parent/ValidationCard';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { onMoneyRequestsSnapshot, resolveMoneyRequest } from '@/lib/firestore';
import { formatCurrencyShort, formatRelativeDate } from '@/utils/formatters';
import { MoneyRequest, Timestamp } from '@/types';
import colors from '@/constants/colors';

export default function ValidationsScreen() {
  const user = useAuthStore((s) => s.user);
  const { missions, isLoading } = useMissions();
  const { children } = useChildren();
  const { completeMission, updateMissionStatus } = useMissionStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);

  const pendingMissions = missions.filter((m) => m.status === 'pending_validation');
  const pendingRequests = moneyRequests.filter((r) => r.status === 'pending');

  const getChildNameByAuthUid = (authUid: string) =>
    children.find((c) => c.linkedUserId === authUid)?.firstName ?? 'Enfant';
  const getChildAvatarByAuthUid = (authUid: string) =>
    children.find((c) => c.linkedUserId === authUid)?.avatarId ?? '';

  // Souscription temps réel aux demandes d'argent
  useEffect(() => {
    if (!user) return;
    const unsub = onMoneyRequestsSnapshot(user.id, user.familyId!, user.role, setMoneyRequests);
    return () => unsub();
  }, [user?.id]);

  const handleApproveMission = async (missionId: string) => {
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
          setLoadingId(missionId);
          await updateMissionStatus(missionId, 'available');
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Validations" subtitle={`${totalPending} en attente`} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {totalPending === 0 ? (
          <EmptyState
            emoji="✅"
            title="Rien à valider"
            description="Toutes les missions et demandes sont à jour."
          />
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.textPrimary,
                    marginBottom: 12,
                  }}
                >
                  Demandes d'argent ({pendingRequests.length})
                </Text>
                {pendingRequests.map((req) => (
                  <Card key={req.id} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Avatar avatarId={getChildAvatarByAuthUid(req.childId)} size={40} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                          {getChildNameByAuthUid(req.childId)}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                          {formatRelativeDate(req.createdAt)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '900',
                          color: colors.primary,
                        }}
                      >
                        {formatCurrencyShort(req.amount)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textPrimary,
                        marginBottom: 12,
                        fontStyle: 'italic',
                      }}
                    >
                      « {req.reason} »
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleRejectRequest(req)}
                        disabled={loadingId === req.id}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 11,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: colors.error,
                          opacity: loadingId === req.id ? 0.5 : 1,
                        }}
                      >
                        <Ionicons name="close" size={16} color={colors.error} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.error }}>
                          Refuser
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleApproveRequest(req)}
                        disabled={loadingId === req.id}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 11,
                          borderRadius: 12,
                          backgroundColor: colors.success,
                          opacity: loadingId === req.id ? 0.5 : 1,
                        }}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
                          Accepter
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {pendingMissions.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.textPrimary,
                    marginTop: pendingRequests.length > 0 ? 20 : 0,
                    marginBottom: 12,
                  }}
                >
                  Missions à valider ({pendingMissions.length})
                </Text>
                {pendingMissions.map((m) => (
                  <ValidationCard
                    key={m.id}
                    mission={m}
                    childName={getChildNameByAuthUid(m.childId)}
                    onApprove={() => handleApproveMission(m.id)}
                    onReject={() => handleRejectMission(m.id)}
                    loading={loadingId === m.id}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
