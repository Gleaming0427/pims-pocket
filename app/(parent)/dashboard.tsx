import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useMissions } from '@/hooks/useMissions';
import { useNotifications } from '@/hooks/useNotifications';
import { onMoneyRequestsSnapshot, onFamilyGoalsSnapshot } from '@/lib/firestore';
import { Child, Goal, MoneyRequest } from '@/types';
import ChildCard from '@/components/parent/ChildCard';
import FamilyMoneyCard from '@/components/parent/FamilyMoneyCard';
import ParentArtwork from '@/components/parent/ParentArtwork';
import GoalProgressCard from '@/components/shared/GoalProgressCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DashedButton from '@/components/ui/DashedButton';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Header from '@/components/shared/Header';
import NotificationBell from '@/components/shared/NotificationBell';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import colors from '@/constants/colors';

type HomeTab = 'children' | 'goals';

// Un objectif ou une mission référence l'enfant par son UID (childId) ou,
// pour les anciens docs, par l'ID de sa fiche (childDocId).
function belongsTo(child: Child, item: { childId: string; childDocId?: string }) {
  return (!!child.linkedUserId && item.childId === child.linkedUserId) || item.childDocId === child.id;
}

export default function ParentDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { children, isLoading } = useChildren();
  const { isLoading: missionsLoading, missions } = useMissions();
  const { unreadCount } = useNotifications();

  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tab, setTab] = useState<HomeTab>('children');
  const [verifSent, setVerifSent] = useState(false);
  const [verifLoading, setVerifLoading] = useState(false);

  // Souscription temps réel aux demandes d'argent
  useEffect(() => {
    if (!user) return;
    const unsub = onMoneyRequestsSnapshot(user.id, user.familyId!, user.role, setMoneyRequests);
    return () => unsub();
  }, [user?.id]);

  // Souscription temps réel aux objectifs d'épargne de la famille
  useEffect(() => {
    if (!user?.familyId) return;
    const unsub = onFamilyGoalsSnapshot(user.familyId, setGoals);
    return () => unsub();
  }, [user?.familyId]);

  const handleResendVerification = async () => {
    if (verifLoading) return;
    setVerifLoading(true);
    try {
      await useAuthStore.getState().resendVerificationEmail();
      setVerifSent(true);
    } catch {
      // Erreur déjà gérée dans le store
    } finally {
      setVerifLoading(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (verifLoading) return;
    setVerifLoading(true);
    try {
      const { auth } = await import('@/lib/firebase');
      if (auth.currentUser) {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);
        if (auth.currentUser.emailVerified) {
          useAuthStore.getState().setUser({
            ...useAuthStore.getState().user!,
            emailVerified: true,
          });
        } else {
          Alert.alert(
            'Pas encore vérifié',
            "Ton email n'est pas encore vérifié. Ouvre le mail que nous t'avons envoyé et clique sur le lien de confirmation."
          );
        }
      }
    } catch {
      // Silencieux
    } finally {
      setVerifLoading(false);
    }
  };

  const pendingCount =
    missions.filter((m) => m.status === 'pending_validation').length +
    moneyRequests.filter((r) => r.status === 'pending').length;

  const activeMissionsFor = (child: Child) =>
    missions.filter(
      (m) => (m.status === 'available' || m.status === 'in_progress') && belongsTo(child, m)
    ).length;

  // Objectifs en cours d'abord (les plus avancés en tête), puis les atteints
  const goalProgress = (g: Goal) => (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0);
  const visibleGoals = [
    ...goals
      .filter((g) => g.status === 'active')
      .sort((a, b) => goalProgress(b) - goalProgress(a)),
    ...goals
      .filter((g) => g.status === 'completed')
      .sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0))
      .slice(0, 3),
  ];
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;

  if (isLoading || missionsLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={`Bonjour ${user?.displayName ?? ''}`}
        subtitle="Bienvenue dans votre espace famille"
        rightAction={
          <NotificationBell
            count={unreadCount}
            onPress={() => router.push('/notifications')}
          />
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Bannière de vérification d'email */}
        {user && user.role === 'parent' && !user.emailVerified && (
          <View
            style={{
              backgroundColor: colors.warning + '12',
              borderRadius: 16,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  backgroundColor: colors.warning + '25',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="mail-unread" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                  Vérifie ton email
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                  {verifSent
                    ? 'Email renvoyé ! Vérifie ta boîte de réception.'
                    : 'Un email de confirmation t\'attend dans ta boîte mail.'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                onPress={handleResendVerification}
                disabled={verifLoading}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: colors.warning,
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                  opacity: verifLoading ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>
                  {verifLoading ? 'Envoi...' : "Renvoyer l'email"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRefreshVerification}
                disabled={verifLoading}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: colors.success + '12',
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                  opacity: verifLoading ? 0.6 : 1,
                }}
              >
                <Text style={{ color: colors.success, fontWeight: '700', fontSize: 13 }}>
                  J'ai vérifié
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Vue d'ensemble : l'argent des enfants */}
        <FamilyMoneyCard children={children} />

        {/* Actions principales */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Button
            title="Envoyer"
            variant="dark"
            fullWidth={false}
            style={{ flex: 1 }}
            icon={<ParentArtwork name="transfer" size={28} />}
            onPress={() => router.push('/(parent)/send-money')}
          />
          <Button
            title="Mission"
            variant="light"
            fullWidth={false}
            style={{ flex: 1 }}
            icon={<ParentArtwork name="mission" size={28} />}
            onPress={() => router.push('/(parent)/missions/create')}
          />
        </View>

        {/* Rappel validations en attente */}
        {pendingCount > 0 && (
          <Card
            onPress={() => router.push('/(parent)/validations')}
            padding={14}
            style={{ marginBottom: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ParentArtwork name="validation" size={44} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                  {pendingCount} élément{pendingCount > 1 ? 's' : ''} à valider
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Les enfants attendent ta réponse
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
                  À traiter
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Enfants / objectifs */}
        <SegmentedControl
          value={tab}
          onChange={setTab}
          style={{ marginTop: 8, marginBottom: 14 }}
          options={[
            { value: 'children', label: 'Enfants', count: children.length },
            { value: 'goals', label: 'Objectifs', count: activeGoalsCount },
          ]}
        />

        {tab === 'children' &&
          (children.length === 0 ? (
            <>
              <EmptyState
                illustration={<ParentArtwork name="family" size={80} />}
                title="Aucun enfant"
                description="Ajoutez votre premier enfant pour commencer à gérer son argent de poche."
                actionLabel="Ajouter un enfant"
                onAction={() => router.push('/(parent)/child/add')}
              />
              {/* Second parent qui vient de créer son compte : rejoindre la famille existante */}
              <Card onPress={() => router.push('/(parent)/family-parents')} padding={14}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ParentArtwork name="family" size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                      L'autre parent utilise déjà l'app ?
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      Rejoins sa famille avec son code d'invitation
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </View>
              </Card>
            </>
          ) : (
            <>
              {children.map((child) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  activeMissions={activeMissionsFor(child)}
                  onPress={() => router.push(`/(parent)/child/${child.id}`)}
                />
              ))}
              <DashedButton
                label="Ajouter un enfant"
                onPress={() => router.push('/(parent)/child/add')}
              />
            </>
          ))}

        {tab === 'goals' &&
          (visibleGoals.length === 0 ? (
            <EmptyState
              illustration={<ParentArtwork name="savings" size={80} />}
              title="Aucun objectif"
              description="Tes enfants peuvent créer leurs objectifs d'épargne depuis leur espace."
            />
          ) : (
            visibleGoals.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                child={children.find((c) => belongsTo(c, goal))}
              />
            ))
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
