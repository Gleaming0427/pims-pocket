import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { getEarnedBadges, onBadgesSnapshot } from '@/lib/firestore';
import { EarnedBadge, BadgeDefinition } from '@/types';
import Header from '@/components/shared/Header';
import LoadingScreen from '@/components/shared/LoadingScreen';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import { SplitBar, LegendRow } from '@/components/shared/SplitBar';
import Card from '@/components/ui/Card';
import BadgeArtwork from '@/components/child/BadgeArtwork';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import badgesDef from '@/constants/badges';
import colors from '@/constants/colors';
import { getReadableAccent } from '@/utils/colorContrast';
import { useChildThemeStore } from '@/stores/childThemeStore';

type BadgeTab = 'all' | 'earned';

export default function BadgesScreen() {
  const accent = useChildThemeStore((state) => state.accent);
  const user = useAuthStore((state) => state.user);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<BadgeTab>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const { fontScale } = useWindowDimensions();

  useEffect(() => {
    if (!user) return;
    getEarnedBadges(user.id)
      .then(setEarnedBadges)
      .finally(() => setIsLoading(false));
    const unsubscribe = onBadgesSnapshot(user.id, (badges) => {
      setEarnedBadges(badges);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [user?.id]);

  if (isLoading) return <LoadingScreen />;

  const earnedIds = new Set(earnedBadges.map((badge) => badge.badgeType));
  const earned = badgesDef.filter((badge) => earnedIds.has(badge.id));
  const locked = badgesDef.filter((badge) => !earnedIds.has(badge.id));
  const total = badgesDef.length;
  const progress = total > 0 ? Math.round((earned.length / total) * 100) : 0;
  const visibleBadges = tab === 'earned' ? earned : badgesDef;
  const columns = Math.max(1, Math.min(3, Math.floor((gridWidth + 12) / (128 * fontScale + 12))));
  const tileWidth = gridWidth > 0 ? (gridWidth - (columns - 1) * 12) / columns : undefined;
  const selectedEarned = selectedBadge ? earnedIds.has(selectedBadge.id) : false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Mes badges" homeButton homeTarget="/(child)/dashboard" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        <Card padding={20} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                Ma collection
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {locked.length === 0 ? 'Collection complète, bravo !' : 'Chaque effort te fait grandir !'}
              </Text>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.starGold + '25', alignItems: 'center', justifyContent: 'center' }}>
              <BadgeArtwork badgeId="super_saver" size={32} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 18 }}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 }}>
              {earned.length}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 8 }}>
              badge{earned.length > 1 ? 's' : ''} sur {total}
            </Text>
          </View>

          <View accessibilityRole="progressbar" accessibilityLabel="Progression de ma collection" accessibilityValue={{ min: 0, max: 100, now: progress }}>
            <SplitBar
              segments={[
                { value: earned.length, color: colors.starGold },
                { value: locked.length, color: colors.canvasMuted },
              ]}
              style={{ marginTop: 14, marginBottom: 12 }}
            />
          </View>
          <LegendRow color={colors.starGold} label="Débloqués" share={String(earned.length)} />
          <LegendRow color={colors.textLight} outlined label="À découvrir" share={String(locked.length)} />
        </Card>

        <SegmentedControl
          value={tab}
          onChange={setTab}
          style={{ marginBottom: 14 }}
          options={[
            { value: 'all', label: 'Collection', count: total },
            { value: 'earned', label: 'Gagnés', count: earned.length },
          ]}
        />

        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
          Touche un trophée pour découvrir son défi.
        </Text>
        {visibleBadges.length === 0 && (
          <EmptyTabCard
            emoji="🌱"
            title="Ton premier trophée t’attend !"
            description="Explore la collection pour découvrir les défis à relever."
          />
        )}
        <View
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
        >
          {visibleBadges.map((badge) => {
            const isEarned = earnedIds.has(badge.id);
            return (
              <TouchableOpacity
                key={badge.id}
                onPress={() => setSelectedBadge(badge)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={badge.name + (isEarned ? ', gagné' : ', à débloquer')}
                accessibilityHint="Afficher la condition de déblocage"
                style={{
                  width: tileWidth,
                  padding: 16,
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderColor: isEarned ? colors.starGold : colors.canvasMuted,
                  borderStyle: isEarned ? 'solid' : 'dashed',
                }}
              >
                <View style={{
                  width: 88, height: 88, borderRadius: 44,
                  backgroundColor: isEarned ? colors.starGold + '25' : colors.canvas,
                  borderWidth: 3,
                  borderColor: isEarned ? colors.starGold : colors.canvasMuted,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <BadgeArtwork badgeId={badge.id} size={64} locked={!isEarned} />
                  <View style={{
                    position: 'absolute', right: -3, bottom: -3,
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
                    borderWidth: 2, borderColor: isEarned ? colors.starGold : colors.canvasMuted,
                  }}>
                    <Ionicons
                      name={isEarned ? 'checkmark' : 'lock-closed'}
                      size={15}
                      color={isEarned ? getReadableAccent(accent) : colors.textSecondary}
                    />
                  </View>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 }}>
                  {badge.name}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 'auto' }}>
                  {isEarned ? 'Gagné !' : 'À débloquer'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!selectedBadge} onClose={() => setSelectedBadge(null)} title="Ton trophée">
        {selectedBadge && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 112, height: 112, borderRadius: 56,
                backgroundColor: selectedEarned ? colors.starGold + '25' : colors.canvas,
                borderWidth: 3, borderColor: selectedEarned ? colors.starGold : colors.canvasMuted,
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <BadgeArtwork badgeId={selectedBadge.id} size={88} locked={!selectedEarned} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' }}>
                {selectedBadge.name}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 6 }}>
                {selectedEarned ? 'Bravo, ce trophée est à toi !' : 'Un nouveau défi à relever'}
              </Text>
            </View>
            <View style={{ backgroundColor: colors.canvas, padding: 16, borderRadius: 16, marginVertical: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                {selectedEarned ? 'Le défi accompli' : 'Comment le gagner ?'}
              </Text>
              <Text style={{ fontSize: 16, lineHeight: 24, color: colors.textSecondary }}>
                {selectedBadge.description}
              </Text>
            </View>
            <Button
              title={selectedEarned ? 'Trop bien !' : 'À moi de jouer !'}
              accentColor={accent}
              onPress={() => setSelectedBadge(null)}
            />
          </ScrollView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
