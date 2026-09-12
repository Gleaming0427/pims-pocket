import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useMissions } from '@/hooks/useMissions';
import { useNotifications } from '@/hooks/useNotifications';
import { onMoneyRequestsSnapshot } from '@/lib/firestore';
import { MoneyRequest } from '@/types';
import ChildCard from '@/components/parent/ChildCard';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Header from '@/components/shared/Header';
import NotificationBell from '@/components/shared/NotificationBell';
import NotificationsModal from '@/components/shared/NotificationsModal';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

export default function ParentDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { children, isLoading } = useChildren();
  const { isLoading: missionsLoading, missions } = useMissions();
  const { unreadCount, notifications, markAsRead, isLoading: notifLoading } = useNotifications();
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);
  const [verifSent, setVerifSent] = useState(false);
  const [verifLoading, setVerifLoading] = useState(false);

  // Souscription temps réel aux demandes d'argent
  useEffect(() => {
    if (!user) return;
    const unsub = onMoneyRequestsSnapshot(user.id, user.familyId!, user.role, setMoneyRequests);
    return () => unsub();
  }, [user?.id]);

  const handleResendVerification = async () => {
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
  const totalDistributed = children.reduce((sum, c) => sum + c.totalEarned, 0);

  if (isLoading || missionsLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        title={`Bonjour ${user?.displayName ?? ''} 👋`}
        subtitle="Bienvenue dans votre espace famille"
        rightAction={
          <NotificationBell
            count={unreadCount}
            onPress={() => setNotifModalVisible(true)}
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

        {/* Carte héro : la famille d'abord */}
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 24,
            padding: 22,
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
              backgroundColor: colors.primaryLight + '30',
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
              backgroundColor: colors.starGold + '1A',
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 15 }}>💰</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' }}>
              Argent de poche distribué
            </Text>
          </View>

          <Text style={{ fontSize: 34, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 }}>
            {formatCurrencyShort(totalDistributed)}
          </Text>

          {/* Les enfants, visibles d'un coup d'œil */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 16,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {children.slice(0, 4).map((child, i) => (
                <View
                  key={child.id}
                  style={{
                    marginLeft: i === 0 ? 0 : -10,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    borderRadius: 999,
                  }}
                >
                  <Avatar avatarId={child.avatarId} size={36} />
                </View>
              ))}
              {children.length > 4 && (
                <View
                  style={{
                    marginLeft: -10,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    borderWidth: 2,
                    borderColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>
                    +{children.length - 4}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => router.push('/(parent)/child/add')}
                activeOpacity={0.7}
                style={{
                  marginLeft: children.length > 0 ? -10 : 0,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text
              style={{
                marginLeft: 12,
                flex: 1,
                fontSize: 12,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              {children.length > 0
                ? `${children.length} membre${children.length > 1 ? 's' : ''} dans la famille`
                : 'Ajoute tes enfants pour commencer'}
            </Text>
          </View>
        </View>

        {/* Actions rapides : grandes, lisibles par toute la famille */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Card
            onPress={() => router.push('/(parent)/send-money')}
            style={{ flex: 1, alignItems: 'center' }}
            padding={18}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26 }}>💸</Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 10,
              }}
            >
              Envoyer
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
              de l'argent
            </Text>
          </Card>
          <Card
            onPress={() => router.push('/(parent)/missions/create')}
            style={{ flex: 1, alignItems: 'center' }}
            padding={18}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.accentOrange + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26 }}>⭐</Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 10,
              }}
            >
              Mission
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
              à accomplir
            </Text>
          </Card>
        </View>

        {/* Rappel validations en attente */}
        {pendingCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(parent)/validations')}
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
              <Ionicons name="checkmark-done" size={20} color={colors.accentOrange} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                📣 {pendingCount} élément{pendingCount > 1 ? 's' : ''} à valider
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                Les enfants attendent ta réponse !
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}

        {/* Section enfants */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
              Mes enfants
            </Text>
            {children.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary + '12',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                  {children.length}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(parent)/child/add')}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.primary + '10',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
              Ajouter
            </Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 ? (
          <EmptyState
            emoji="👶"
            title="Aucun enfant"
            description="Ajoutez votre premier enfant pour commencer à gérer son argent de poche."
            actionLabel="Ajouter un enfant"
            onAction={() => router.push('/(parent)/child/add')}
          />
        ) : (
          children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onPress={() => router.push(`/(parent)/child/${child.id}`)}
            />
          ))
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
