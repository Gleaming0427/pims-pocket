import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { getEarnedBadges, onBadgesSnapshot } from '@/lib/firestore';
import { EarnedBadge } from '@/types';
import BadgeItem from '@/components/child/BadgeItem';
import Header from '@/components/shared/Header';
import LoadingScreen from '@/components/shared/LoadingScreen';
import ProgressBar from '@/components/ui/ProgressBar';
import badgesDef from '@/constants/badges';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

export default function BadgesScreen() {
    const accent = useChildThemeStore((s) => s.accent);
const user = useAuthStore((s) => s.user);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getEarnedBadges(user.id)
      .then(setEarnedBadges)
      .finally(() => setIsLoading(false));
    // Temps réel : les badges apparaissent dès qu'ils sont gagnés
    const unsub = onBadgesSnapshot(user.id, (badges) => {
      setEarnedBadges(badges);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user?.id]);

  if (isLoading) return <LoadingScreen />;

  const earnedIds = new Set(earnedBadges.map((b) => b.badgeType));
  const earned = badgesDef.filter((b) => earnedIds.has(b.id));
  const locked = badgesDef.filter((b) => !earnedIds.has(b.id));
  const total = badgesDef.length;
  const progress = total > 0 ? earnedBadges.length / total : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      <Header
        title="Mes badges"
        homeButton
        homeTarget="/(child)/dashboard"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Carte progression */}
        <View
          style={{
            backgroundColor: colors.starGold + '15',
            borderRadius: 20,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: colors.starGold + '30',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 24 }}>🏆</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''} sur {total}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {earnedBadges.length >= total
                  ? 'Collection complète, bravo ! 🎉'
                  : `Encore ${total - earnedBadges.length} à découvrir !`}
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={progress}
            color={colors.starGold}
            showPercentage
            height={10}
          />
        </View>

        {/* Débloqués */}
        {earned.length > 0 && (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
                ✨ Débloqués
              </Text>
              <View
                style={{
                  backgroundColor: colors.starGold + '25',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                  {earned.length}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 24,
              }}
            >
              {earned.map((badge) => (
                <BadgeItem key={badge.id} badge={badge} earned size="lg" />
              ))}
            </View>
          </>
        )}

        {/* À découvrir */}
        {locked.length > 0 && (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
                🔒 À découvrir
              </Text>
              <View
                style={{
                  backgroundColor: colors.textLight + '20',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                  {locked.length}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              {locked.map((badge) => (
                <BadgeItem key={badge.id} badge={badge} earned={false} size="lg" />
              ))}
            </View>
          </>
        )}

        {earnedBadges.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 36 }}>🎯</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 8,
              }}
            >
              Pas encore de badge
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              Termine des missions pour gagner ton premier badge !
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
