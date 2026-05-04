import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useMissions } from '@/hooks/useMissions';
import { useNotifications } from '@/hooks/useNotifications';
import PiggyBank from '@/components/child/PiggyBank';
import ChildMissionCard from '@/components/child/MissionCard';
import Card from '@/components/ui/Card';
import NotificationBell from '@/components/shared/NotificationBell';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { getGoals } from '@/lib/firestore';
import { getEarnedBadges } from '@/lib/firestore';
import { Goal, EarnedBadge } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import ProgressBar from '@/components/ui/ProgressBar';
import badgesDef from '@/constants/badges';
import colors from '@/constants/colors';

export default function ChildDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { missions } = useMissions();
  const { unreadCount } = useNotifications();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    getGoals(user.id).then(setGoals).catch(() => {});
    getEarnedBadges(user.id).then(setEarnedBadges).catch(() => {});
  }, [user?.id]);

  const availableMissions = missions
    .filter((m) => m.status === 'available' || m.status === 'in_progress')
    .slice(0, 3);

  const mainGoal = goals.find((g) => g.status === 'active');

  const recentBadges = earnedBadges.slice(0, 3);

  if (!user) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/(child)/profile')}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 28 }}>👋</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: colors.textPrimary,
              marginLeft: 8,
            }}
          >
            Salut !
          </Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/(child)/history')}>
            <Ionicons name="time-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <NotificationBell count={unreadCount} onPress={() => {}} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <PiggyBank balance={balance} />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => router.push('/(child)/ask-money')}
            style={{
              flex: 1,
              backgroundColor: colors.piggyPink,
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="hand-left" size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
              Demander
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(child)/goals')}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="flag" size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
              Épargner
            </Text>
          </TouchableOpacity>
        </View>

        {availableMissions.length > 0 && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Mes missions
            </Text>
            {availableMissions.map((m) => (
              <ChildMissionCard key={m.id} mission={m} />
            ))}
          </>
        )}

        {mainGoal && (
          <Card variant="child" style={{ marginTop: 8, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: 8,
              }}
            >
              🎯 {mainGoal.title}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 10 }}>
              {formatCurrencyShort(mainGoal.currentAmount)} / {formatCurrencyShort(mainGoal.targetAmount)}
            </Text>
            <ProgressBar
              progress={(() => {
                const cur = Number(mainGoal.currentAmount);
                const tgt = Number(mainGoal.targetAmount);
                if (!Number.isFinite(cur) || !Number.isFinite(tgt) || tgt <= 0) return 0;
                return cur / tgt;
              })()}
              color={colors.starGold}
              showPercentage
            />
          </Card>
        )}

        {recentBadges.length > 0 && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              Derniers badges
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {recentBadges.map((b) => {
                const def = badgesDef.find((bd) => bd.id === b.badgeType);
                return def ? (
                  <View
                    key={b.id}
                    style={{
                      alignItems: 'center',
                      backgroundColor: colors.starGold + '20',
                      padding: 12,
                      borderRadius: 16,
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{def.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: colors.textPrimary,
                        marginTop: 4,
                      }}
                    >
                      {def.name}
                    </Text>
                  </View>
                ) : null;
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
