import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { getEarnedBadges } from '@/lib/firestore';
import { EarnedBadge } from '@/types';
import BadgeItem from '@/components/child/BadgeItem';
import Header from '@/components/shared/Header';
import LoadingScreen from '@/components/shared/LoadingScreen';
import badgesDef from '@/constants/badges';
import colors from '@/constants/colors';

export default function BadgesScreen() {
  const user = useAuthStore((s) => s.user);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getEarnedBadges(user.id)
      .then(setEarnedBadges)
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  if (isLoading) return <LoadingScreen />;

  const earnedIds = new Set(earnedBadges.map((b) => b.badgeType));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header
        title="Mes badges"
        subtitle={`${earnedBadges.length}/${badgesDef.length} débloqués`}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 48 }}>🏆</Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: colors.textPrimary,
              marginTop: 8,
            }}
          >
            {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          {badgesDef.map((badge) => (
            <BadgeItem
              key={badge.id}
              badge={badge}
              earned={earnedIds.has(badge.id)}
              size="lg"
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
