import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import { useMissions } from '@/hooks/useMissions';
import { useNotifications } from '@/hooks/useNotifications';
import ChildCard from '@/components/parent/ChildCard';
import Card from '@/components/ui/Card';
import Header from '@/components/shared/Header';
import NotificationBell from '@/components/shared/NotificationBell';
import EmptyState from '@/components/shared/EmptyState';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { formatCurrencyShort } from '@/utils/formatters';
import colors from '@/constants/colors';

export default function ParentDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { children, isLoading } = useChildren();
  const { getPendingValidations } = useMissions();
  const { unreadCount } = useNotifications();

  const pendingCount = getPendingValidations().length;
  const totalDistributed = children.reduce((sum, c) => sum + c.totalEarned, 0);

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        title={`Bonjour ${user?.displayName ?? ''}`}
        subtitle="Tableau de bord"
        rightAction={
          <NotificationBell
            count={unreadCount}
            onPress={() => {}}
          />
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.primary }}>
              {children.length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Enfants
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.success }}>
              {formatCurrencyShort(totalDistributed)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Distribué
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.warning }}>
              {pendingCount}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              À valider
            </Text>
          </Card>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => router.push('/(parent)/send-money')}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="send" size={20} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
              Envoyer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(parent)/missions/create')}
            style={{
              flex: 1,
              backgroundColor: colors.accentOrange,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="flash" size={20} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
              Mission
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
            Mes enfants
          </Text>
          <TouchableOpacity onPress={() => router.push('/(parent)/child/add')}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
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
    </SafeAreaView>
  );
}
