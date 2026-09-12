import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMissions } from '@/hooks/useMissions';
import { useMissionStore } from '@/stores/missionStore';
import ChildMissionCard from '@/components/child/MissionCard';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

export default function ChildMissionsScreen() {
    const accent = useChildThemeStore((s) => s.accent);
const { missions, isLoading } = useMissions();
  const { updateMissionStatus } = useMissionStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeMissions = missions.filter(
    (m) => m.status === 'available' || m.status === 'in_progress'
  );
  const pendingMissions = missions.filter((m) => m.status === 'pending_validation');
  const completedMissions = missions.filter((m) => m.status === 'completed');

  const handleComplete = (missionId: string) => {
    Alert.alert(
      'Mission terminée ?',
      'Ton parent devra valider que tu as bien terminé cette mission.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: "J'ai terminé !",
          onPress: async () => {
            setLoadingId(missionId);
            await updateMissionStatus(missionId, 'pending_validation');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setLoadingId(null);
          },
        },
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header title="Mes missions" homeButton homeTarget="/(child)/dashboard" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {missions.length === 0 ? (
          <EmptyState
            emoji="🎮"
            title="Pas encore de missions"
            description="Tes parents vont bientôt te donner des missions à accomplir !"
          />
        ) : (
          <>
            {activeMissions.length > 0 && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: colors.textPrimary,
                    }}
                  >
                    🎯 À faire
                  </Text>
                  <View
                    style={{
                      backgroundColor: accent + '15',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>
                      {activeMissions.length}
                    </Text>
                  </View>
                </View>
                {activeMissions.map((m) => (
                  <ChildMissionCard
                    key={m.id}
                    mission={m}
                    onComplete={() => handleComplete(m.id)}
                    loading={loadingId === m.id}
                  />
                ))}
              </>
            )}

            {pendingMissions.length > 0 && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 24,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: colors.textPrimary,
                    }}
                  >
                    ⏳ En attente
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.accentOrange + '15',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accentOrange }}>
                      {pendingMissions.length}
                    </Text>
                  </View>
                </View>
                {pendingMissions.map((m) => (
                  <ChildMissionCard key={m.id} mission={m} />
                ))}
              </>
            )}

            {completedMissions.length > 0 && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 24,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: colors.textPrimary,
                    }}
                  >
                    ✅ Terminées
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.success + '15',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                      {completedMissions.length}
                    </Text>
                  </View>
                </View>
                {completedMissions.slice(0, 10).map((m) => (
                  <ChildMissionCard key={m.id} mission={m} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
