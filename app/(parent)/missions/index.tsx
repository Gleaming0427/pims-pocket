import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMissions } from '@/hooks/useMissions';
import { useChildren } from '@/hooks/useChildren';
import MissionCard from '@/components/parent/MissionCard';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import colors from '@/constants/colors';

export default function MissionsScreen() {
  const router = useRouter();
  const { missions, isLoading } = useMissions();
  const { children } = useChildren();

  const getChildName = (childId: string) =>
    children.find((c) => c.id === childId)?.firstName ?? '';

  const activeMissions = missions.filter(
    (m) => m.status !== 'completed' && m.status !== 'expired'
  );
  const completedMissions = missions.filter((m) => m.status === 'completed');

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        title="Missions"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(parent)/missions/create')}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {missions.length === 0 ? (
          <EmptyState
            emoji="⚡"
            title="Aucune mission"
            description="Créez des missions pour motiver vos enfants et les récompenser !"
            actionLabel="Créer une mission"
            onAction={() => router.push('/(parent)/missions/create')}
          />
        ) : (
          <>
            {activeMissions.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.textPrimary,
                    marginBottom: 12,
                  }}
                >
                  En cours ({activeMissions.length})
                </Text>
                {activeMissions.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    childName={getChildName(m.childId)}
                  />
                ))}
              </>
            )}

            {completedMissions.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.textSecondary,
                    marginTop: 16,
                    marginBottom: 12,
                  }}
                >
                  Terminées ({completedMissions.length})
                </Text>
                {completedMissions.slice(0, 10).map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    childName={getChildName(m.childId)}
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
