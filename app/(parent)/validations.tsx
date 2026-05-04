import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMissions } from '@/hooks/useMissions';
import { useChildren } from '@/hooks/useChildren';
import { useAuthStore } from '@/stores/authStore';
import { useMissionStore } from '@/stores/missionStore';
import ValidationCard from '@/components/parent/ValidationCard';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import colors from '@/constants/colors';

export default function ValidationsScreen() {
  const user = useAuthStore((s) => s.user);
  const { missions, isLoading } = useMissions();
  const { children } = useChildren();
  const { completeMission, updateMissionStatus } = useMissionStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingMissions = missions.filter((m) => m.status === 'pending_validation');
  const getChildName = (childId: string) =>
    children.find((c) => c.id === childId)?.firstName ?? 'Enfant';

  const handleApprove = async (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || !user) return;

    setLoadingId(missionId);
    try {
      await completeMission(missionId, mission, user.id);
      Alert.alert('Mission validée !', `La récompense a été créditée.`);
    } catch {
      Alert.alert('Erreur', 'Impossible de valider la mission.');
    }
    setLoadingId(null);
  };

  const handleReject = (missionId: string) => {
    Alert.alert(
      'Refuser la mission ?',
      'L\'enfant devra recommencer la mission.',
      [
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
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Validations" subtitle={`${pendingMissions.length} en attente`} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {pendingMissions.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="Rien à valider"
            description="Toutes les missions sont à jour ! Vos enfants n'ont pas encore soumis de mission."
          />
        ) : (
          pendingMissions.map((m) => (
            <ValidationCard
              key={m.id}
              mission={m}
              childName={getChildName(m.childId)}
              onApprove={() => handleApprove(m.id)}
              onReject={() => handleReject(m.id)}
              loading={loadingId === m.id}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
