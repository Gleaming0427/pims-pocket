import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useMissions } from '@/hooks/useMissions';
import { useNotifications } from '@/hooks/useNotifications';
import ChildMissionCard from '@/components/child/MissionCard';
import NotificationBell from '@/components/shared/NotificationBell';
import BadgeArtwork from '@/components/child/BadgeArtwork';
import LoadingScreen from '@/components/shared/LoadingScreen';
import Header from '@/components/shared/Header';
import MoneySplitCard from '@/components/shared/MoneySplitCard';
import GoalProgressCard from '@/components/shared/GoalProgressCard';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import { onGoalsSnapshot } from '@/lib/firestore';
import { getEarnedBadges, onBadgesSnapshot } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Goal, EarnedBadge } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DashedButton from '@/components/ui/DashedButton';
import SegmentedControl from '@/components/ui/SegmentedControl';
import badgesDef from '@/constants/badges';
import colors from '@/constants/colors';
import { getContrastTextColor, getReadableAccent } from '@/utils/colorContrast';
import { useChildThemeStore } from '@/stores/childThemeStore';

type HomeTab = 'missions' | 'goals' | 'badges';

export default function ChildDashboard() {
  const accent = useChildThemeStore((s) => s.accent);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { missions } = useMissions();
  const { unreadCount } = useNotifications();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [tab, setTab] = useState<HomeTab>('missions');

  useEffect(() => {
    if (!user) return;
    const familyId = user.familyId ?? user.id;
    const unsubGoals = onGoalsSnapshot(familyId, user.id, setGoals);
    getEarnedBadges(user.id).then(setEarnedBadges).catch(() => {});
    // Temps réel : un badge gagné apparaît immédiatement
    const unsubBadges = onBadgesSnapshot(user.id, setEarnedBadges);
    return () => {
      unsubGoals();
      unsubBadges();
    };
  }, [user?.id, user?.familyId]);

  // Souscription en temps réel au solde de l'enfant.
  // Le solde est stocké dans families/{familyId}/children/{childDocId}.
  // L'enfant a accès en lecture car la règle Firestore vérifie linkedUserId == auth.uid.
  //
  // familyId et childDocId sont toujours présents :
  // - Nouveaux comptes : écrits par createChildAccount
  // - Anciens comptes : résolus par signInChild (via la Cloud Function getChildLoginToken)
  //   et persistés dans le user doc à la première connexion post-migration.
  useEffect(() => {
    if (!user?.familyId || !user?.childDocId) {
      console.warn(
        '[ChildDashboard] snapshot annulée – familyId=',
        user?.familyId,
        'childDocId=',
        user?.childDocId
      );
      return;
    }
    const ref = doc(db, 'families', user.familyId, 'children', user.childDocId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          console.warn('[ChildDashboard] document introuvable:', ref.path);
          return;
        }
        const data = snap.data();
        setBalance(typeof data?.balance === 'number' ? data.balance : 0);
        setTotalSaved(typeof data?.totalSaved === 'number' ? data.totalSaved : 0);
        setTotalEarned(typeof data?.totalEarned === 'number' ? data.totalEarned : 0);
        setAvatarId(typeof data?.avatarId === 'string' ? data.avatarId : null);
      },
      (err) => console.warn('[ChildDashboard] ERREUR snapshot:', err.code, err.message)
    );
    return unsub;
  }, [user?.familyId, user?.childDocId]);

  const allAvailableMissions = missions.filter(
    (m) => m.status === 'available' || m.status === 'in_progress'
  );
  // L'accueil montre les 3 premières — la page Missions affiche tout
  const availableMissions = allAvailableMissions.slice(0, 3);
  const pendingMissionsCount = missions.filter((m) => m.status === 'pending_validation').length;

  // Objectifs en cours, les plus avancés en tête
  const goalProgress = (g: Goal) => (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0);
  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .sort((a, b) => goalProgress(b) - goalProgress(a));

  const recentBadges = earnedBadges.slice(0, 3);

  if (!user) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={`Bonjour ${user?.displayName ?? ''}`}
        subtitle="Tableau de bord"
        rightAction={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/(child)/history')}>
              <Ionicons name="time-outline" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <NotificationBell count={unreadCount} onPress={() => router.push('/notifications')} />
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Ma tirelire : disponible / épargné */}
        <MoneySplitCard
          title="Ma tirelire"
          subtitle="Mise à jour en temps réel"
          headerRight={avatarId ? <Avatar avatarId={avatarId} size={36} /> : null}
          available={balance}
          saved={totalSaved}
          total={totalEarned}
          totalLabel="Gagné au total"
          availableColor={accent}
          savedColor={colors.starGold}
        />

        {/* Actions principales */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Button
            accentColor={accent}
            title="Demander"
            variant="primary"
            fullWidth={false}
            style={{ flex: 1 }}
            icon={<Ionicons name="hand-left" size={18} color={getContrastTextColor(accent)} />}
            onPress={() => router.push('/(child)/ask-money')}
          />
          <Button
            accentColor={accent}
            title="Épargner"
            variant="light"
            fullWidth={false}
            style={{ flex: 1 }}
            icon={<Ionicons name="flag" size={18} color={getReadableAccent(accent)} />}
            onPress={() => router.push('/(child)/goals')}
          />
        </View>

        {/* Missions en attente de validation */}
        {pendingMissionsCount > 0 && (
          <Card
            onPress={() => router.push('/(child)/missions')}
            padding={14}
            style={{ marginBottom: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.accentOrange + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="hourglass" size={22} color={colors.accentOrange} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                  {pendingMissionsCount} mission{pendingMissionsCount > 1 ? 's' : ''} en attente
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  En attente de validation par un parent
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.accentOrange + '20',
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                  <Ionicons name="time-outline" size={12} color={colors.textPrimary} accessible={false} /> En attente
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Missions / objectifs / badges */}
        <SegmentedControl
          value={tab}
          onChange={setTab}
          style={{ marginTop: 8, marginBottom: 14 }}
          options={[
            { value: 'missions', label: 'Missions', count: allAvailableMissions.length },
            { value: 'goals', label: 'Objectifs', count: activeGoals.length },
            { value: 'badges', label: 'Badges', count: earnedBadges.length },
          ]}
        />

        {tab === 'missions' &&
          (availableMissions.length === 0 ? (
            <EmptyTabCard
              icon="sparkles-outline" iconColor={accent}
              title="Aucune mission pour le moment"
              description="De nouvelles missions arriveront bientôt."
            />
          ) : (
            <>
              {availableMissions.map((m) => (
                <ChildMissionCard
                  key={m.id}
                  mission={m}
                  onPress={() => router.push('/(child)/missions')}
                />
              ))}
              {allAvailableMissions.length > 3 && (
                <TouchableOpacity
                  onPress={() => router.push('/(child)/missions')}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: getReadableAccent(accent) }}>
                    Tout voir ({allAvailableMissions.length})
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={getReadableAccent(accent)} />
                </TouchableOpacity>
              )}
            </>
          ))}

        {tab === 'goals' && (
          <>
            {activeGoals.length === 0 ? (
              <EmptyTabCard
                icon="flag-outline" iconColor={accent}
                title="Pas encore d'objectif"
                description="Choisis un rêve et mets de l'argent de côté pour l'atteindre."
              />
            ) : (
              activeGoals.slice(0, 3).map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  accentColor={colors.starGold}
                  onPress={() => router.push('/(child)/goals')}
                />
              ))
            )}
            <DashedButton
              label="Nouvel objectif"
              onPress={() => router.push('/(child)/goals/create')}
            />
          </>
        )}

        {tab === 'badges' &&
          (recentBadges.length === 0 ? (
            <EmptyTabCard
              icon="ribbon-outline" iconColor={accent}
              title="Pas encore de badge"
              description="Termine des missions et épargne pour en gagner."
            />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {recentBadges.map((b) => {
                  const def = badgesDef.find((bd) => bd.id === b.badgeType);
                  return def ? (
                    <Card key={b.id} style={{ flex: 1, alignItems: 'center' }} padding={14}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          backgroundColor: colors.starGold + '25',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <BadgeArtwork badgeId={def.id} size={40} />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: colors.textPrimary,
                          marginTop: 8,
                          textAlign: 'center',
                        }}
                      >
                        {def.name}
                      </Text>
                    </Card>
                  ) : null;
                })}
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(child)/badges')}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: getReadableAccent(accent) }}>
                  Voir tous mes badges
                </Text>
                <Ionicons name="chevron-forward" size={16} color={getReadableAccent(accent)} />
              </TouchableOpacity>
            </>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
