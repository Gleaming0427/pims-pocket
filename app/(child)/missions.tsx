import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMissions } from '@/hooks/useMissions';
import { useMissionStore } from '@/stores/missionStore';
import ChildMissionCard from '@/components/child/MissionCard';
import Header from '@/components/shared/Header';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import MissionSummaryCard from '@/components/shared/MissionSummaryCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import LoadingScreen from '@/components/shared/LoadingScreen';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

type MissionTab = 'todo' | 'pending' | 'done';

export default function ChildMissionsScreen() {
  const accent = useChildThemeStore((s) => s.accent);
  const { missions, isLoading } = useMissions();
  const { updateMissionStatus } = useMissionStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<MissionTab>('todo');

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
            if (loadingId) return;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Mes missions" homeButton homeTarget="/(child)/dashboard" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {missions.length === 0 ? (
          <EmptyTabCard
            emoji="🎮"
            title="Pas encore de missions"
            description="Tes parents vont bientôt te donner des missions à accomplir !"
          />
        ) : (
          <>
            <MissionSummaryCard
              title="Mes missions"
              todo={activeMissions}
              pending={pendingMissions}
              done={completedMissions}
              todoColor={accent}
              pendingLabel="En attente"
            />

            <SegmentedControl
              value={tab}
              onChange={setTab}
              style={{ marginBottom: 14 }}
              options={[
                { value: 'todo', label: 'À faire', count: activeMissions.length },
                { value: 'pending', label: 'En attente', count: pendingMissions.length },
                { value: 'done', label: 'Terminées', count: completedMissions.length },
              ]}
            />

            {tab === 'todo' &&
              (activeMissions.length === 0 ? (
                <EmptyTabCard
                  emoji="🎉"
                  title="Tout est fait !"
                  description="Bravo, tu n'as plus de mission à faire pour l'instant."
                />
              ) : (
                activeMissions.map((m) => (
                  <ChildMissionCard
                    key={m.id}
                    mission={m}
                    onComplete={() => handleComplete(m.id)}
                    loading={loadingId === m.id}
                  />
                ))
              ))}

            {tab === 'pending' &&
              (pendingMissions.length === 0 ? (
                <EmptyTabCard
                  emoji="⏳"
                  title="Rien en attente"
                  description="Quand tu termines une mission, elle attend ici que ton parent la valide."
                />
              ) : (
                pendingMissions.map((m) => <ChildMissionCard key={m.id} mission={m} />)
              ))}

            {tab === 'done' &&
              (completedMissions.length === 0 ? (
                <EmptyTabCard
                  emoji="🏁"
                  title="Aucune mission terminée"
                  description="Tes missions validées apparaîtront ici."
                />
              ) : (
                completedMissions.slice(0, 10).map((m) => <ChildMissionCard key={m.id} mission={m} />)
              ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
