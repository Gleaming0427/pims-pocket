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
import Avatar from '@/components/ui/Avatar';
import NotificationBell from '@/components/shared/NotificationBell';
import NotificationsModal from '@/components/shared/NotificationsModal';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { onGoalsSnapshot } from '@/lib/firestore';
import { getEarnedBadges } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Goal, EarnedBadge } from '@/types';
import { formatCurrencyShort } from '@/utils/formatters';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';
import badgesDef from '@/constants/badges';
import colors from '@/constants/colors';

export default function ChildDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { missions } = useMissions();
  const { unreadCount, notifications, markAsRead, isLoading: notifLoading } = useNotifications();
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [balance, setBalance] = useState(0);
  const [avatarId, setAvatarId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const familyId = user.familyId ?? user.id;
    const unsub = onGoalsSnapshot(familyId, user.id, setGoals);
    getEarnedBadges(user.id).then(setEarnedBadges).catch(() => {});
    return unsub;
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
        setAvatarId(typeof data?.avatarId === 'string' ? data.avatarId : null);
      },
      (err) => console.warn('[ChildDashboard] ERREUR snapshot:', err.code, err.message)
    );
    return unsub;
  }, [user?.familyId, user?.childDocId]);

  const availableMissions = missions
    .filter((m) => m.status === 'available' || m.status === 'in_progress')
    .slice(0, 3);

  const latestGoal = goals.find((g) => g.status === 'active');

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
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/(child)/profile')}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {avatarId ? (
            <Avatar avatarId={avatarId} size={40} />
          ) : (
            <Text style={{ fontSize: 28 }}>👋</Text>
          )}
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: colors.textPrimary,
              marginLeft: 10,
            }}
          >
            {user.displayName ? `Salut ${user.displayName} !` : 'Salut !'}
          </Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/(child)/history')}>
            <Ionicons name="time-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <NotificationBell count={unreadCount} onPress={() => setNotifModalVisible(true)} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
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

        {latestGoal && (
          <Card variant="child" style={{ marginBottom: 16 }} onPress={() => router.push('/(child)/goals')}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: 8,
              }}
            >
              🎯 {latestGoal.title}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 10 }}>
              {formatCurrencyShort(latestGoal.currentAmount)} / {formatCurrencyShort(latestGoal.targetAmount)}
            </Text>
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
