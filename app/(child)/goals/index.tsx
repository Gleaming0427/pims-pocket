import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { getGoals } from '@/lib/firestore';
import { Goal } from '@/types';
import GoalCard from '@/components/child/GoalCard';
import Header from '@/components/shared/Header';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import colors from '@/constants/colors';

export default function GoalsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getGoals(user.id)
      .then(setGoals)
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  if (isLoading) return <LoadingScreen />;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header
        title="Mes objectifs"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(child)/goals/create')}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {goals.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title="Aucun objectif"
            description="Fixe-toi un objectif d'épargne pour économiser pour quelque chose qui te fait envie !"
            actionLabel="Créer un objectif"
            onAction={() => router.push('/(child)/goals/create')}
          />
        ) : (
          <>
            {activeGoals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
            {completedGoals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
