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
import NotificationBell from '@/components/shared/NotificationBell';
import NotificationsModal from '@/components/shared/NotificationsModal';
import LoadingScreen from '@/components/shared/LoadingScreen';
import Header from '@/components/shared/Header';
import { onGoalsSnapshot } from '@/lib/firestore';
import { getEarnedBadges, onBadgesSnapshot } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Goal, EarnedBadge } from '@/types';
import { formatCurrencyShort, getAge } from '@/utils/formatters';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';
import badgesDef from '@/constants/badges';
import colors from '@/constants/colors';
import { useChildThemeStore } from '@/stores/childThemeStore';

export default function ChildDashboard() {
    const accent = useChildThemeStore((s) => s.accent);
const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { missions } = useMissions();
  const { unreadCount, notifications, markAsRead, isLoading: notifLoading } = useNotifications();
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [balance, setBalance] = useState(0);
  const [birthDate, setBirthDate] = useState<import('@/types').Timestamp | null>(null);

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
        setBirthDate(data?.birthDate ?? null);
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

  const latestGoal = goals.find((g) => g.status === 'active');

  const recentBadges = earnedBadges.slice(0, 3);

  // Mode ado : accueil sobre mais chaleureux — sans la tirelire cochon.
  // Choix produit : appliqué à TOUS les enfants, quel que soit leur âge.
  // (L'ancien seuil adaptatif : birthDate ? getAge(birthDate) >= 12 : false)
  const isTeen = true;

  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;
  const pendingMissionsCount = missions.filter(
    (m) => m.status === 'pending_validation'
  ).length;

  if (!user) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.childBg }}>
      {/* En-tête identique au côté adulte */}
      <Header
        title={`Bonjour ${user?.displayName ?? ''} 👋`}
        subtitle={isTeen ? 'Tableau de bord' : "Tes missions t'attendent !"}
        rightAction={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/(child)/history')}>
              <Ionicons name="time-outline" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <NotificationBell count={unreadCount} onPress={() => setNotifModalVisible(true)} />
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Héro tirelire : turquoise plein, comme le héro violet côté parent */}
        <View
          style={{
            backgroundColor: accent,
            borderRadius: 24,
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          {/* Cercles décoratifs */}
          <View
            style={{
              position: 'absolute',
              top: -45,
              right: -35,
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -55,
              left: -25,
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: colors.starGold + '25',
            }}
          />
          {isTeen ? (
            <View style={{ padding: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 15 }}>💰</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' }}>
                  Mon solde
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 34,
                  fontWeight: '800',
                  color: '#FFF',
                  letterSpacing: -0.5,
                }}
              >
                {formatCurrencyShort(balance)}
              </Text>
            </View>
          ) : (
            <PiggyBank balance={balance} onPink />
          )}

          {/* Chips trésors — comme les chips du héro adulte */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingHorizontal: 20,
              paddingBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => router.push('/(child)/goals')}
              activeOpacity={0.7}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: 'rgba(255,255,255,0.16)',
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontSize: 13 }}>🎯</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
                {goals.filter((g) => g.status === 'active').length} objectif
                {goals.filter((g) => g.status === 'active').length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(child)/badges')}
              activeOpacity={0.7}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: 'rgba(255,255,255,0.16)',
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontSize: 13 }}>🏅</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
                {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Card
            variant="child"
            onPress={() => router.push('/(child)/ask-money')}
            style={{ flex: 1, alignItems: 'center' }}
            padding={18}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: accent + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isTeen ? (
                <Ionicons name="hand-left" size={24} color={accent} />
              ) : (
                <Text style={{ fontSize: 26 }}>💌</Text>
              )}
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 10,
              }}
            >
              Demander
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
              de l'argent
            </Text>
          </Card>
          <Card
            variant="child"
            onPress={() => router.push('/(child)/goals')}
            style={{ flex: 1, alignItems: 'center' }}
            padding={18}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.starGold + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isTeen ? (
                <Ionicons name="flag" size={24} color={colors.primary} />
              ) : (
                <Text style={{ fontSize: 26 }}>🎯</Text>
              )}
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 10,
              }}
            >
              Épargner
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
              pour un rêve
            </Text>
          </Card>
        </View>

        {/* Bannière missions en attente de validation — comme la bannière adulte */}
        {missions.filter((m) => m.status === 'pending_validation').length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(child)/missions')}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accentOrange + '12',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.accentOrange + '30',
              padding: 14,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.accentOrange + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="hourglass" size={20} color={colors.accentOrange} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                ⏳ {missions.filter((m) => m.status === 'pending_validation').length} mission
                {missions.filter((m) => m.status === 'pending_validation').length > 1 ? 's' : ''} en attente
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                {isTeen
                  ? 'En attente de validation par un parent'
                  : 'Tes parents doivent encore valider !'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}

        {/* Objectif en cours */}
        {latestGoal && (
          <Card variant="child" style={{ marginBottom: 24 }} onPress={() => router.push('/(child)/goals')}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.starGold + '25',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>🎯</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.textPrimary,
                  }}
                  numberOfLines={1}
                >
                  {latestGoal.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {formatCurrencyShort(latestGoal.currentAmount)} / {formatCurrencyShort(latestGoal.targetAmount)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </View>
            <ProgressBar
              progress={(() => {
                const cur = Number(latestGoal.currentAmount);
                const tgt = Number(latestGoal.targetAmount);
                if (!Number.isFinite(cur) || !Number.isFinite(tgt) || tgt <= 0) return 0;
                return cur / tgt;
              })()}
              color={colors.starGold}
              showPercentage
            />
          </Card>
        )}

        {/* Missions */}
        {availableMissions.length > 0 ? (
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
                Mes missions
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
                  {allAvailableMissions.length}
                </Text>
              </View>
            </View>
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
                <Text style={{ fontSize: 14, fontWeight: '700', color: accent }}>
                  Tout voir ({allAvailableMissions.length})
                </Text>
                <Ionicons name="chevron-forward" size={16} color={accent} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View
            style={{
              backgroundColor: accent + '08',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 28 }}>🎈</Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 6,
              }}
            >
              Aucune mission pour le moment
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {isTeen
                ? 'De nouvelles missions arriveront bientôt.'
                : 'Profite de ton temps libre, ça reviendra !'}
            </Text>
          </View>
        )}

        {/* Badges */}
        {recentBadges.length > 0 && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 16,
                marginBottom: 12,
              }}
            >
              Derniers badges
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {recentBadges.map((b) => {
                const def = badgesDef.find((bd) => bd.id === b.badgeType);
                return def ? (
                  <Card
                    key={b.id}
                    variant="child"
                    style={{ flex: 1, alignItems: 'center' }}
                    padding={14}
                  >
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
                      <Text style={{ fontSize: 24 }}>{def.emoji}</Text>
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
          </>
        )}
      </ScrollView>
      <NotificationsModal
        visible={notifModalVisible}
        onClose={() => setNotifModalVisible(false)}
        notifications={notifications}
        loading={notifLoading}
        onMarkAsRead={markAsRead}
      />
    </SafeAreaView>
  );
}
