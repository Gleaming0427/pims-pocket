import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import Header from '@/components/shared/Header';
import EmptyTabCard from '@/components/shared/EmptyTabCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { formatRelativeDate } from '@/utils/formatters';
import colors from '@/constants/colors';

type NotificationTab = 'all' | 'unread';

const typeConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  mission_completed: { icon: 'checkbox-outline', label: 'Mission validée', color: colors.success },
  money_received: { icon: 'cash-outline', label: 'Argent reçu', color: colors.primary },
  goal_reached: { icon: 'flag-outline', label: 'Objectif atteint', color: colors.accentOrange },
  money_request: { icon: 'hand-left-outline', label: "Demande d'argent", color: colors.secondary },
  validation_needed: { icon: 'checkmark-circle-outline', label: 'À valider', color: colors.accentOrange },
  allowance_sent: { icon: 'calendar-outline', label: 'Argent de poche', color: colors.primary },
  badge_earned: { icon: 'ribbon-outline', label: 'Badge obtenu', color: colors.accentOrange },
};

export default function NotificationsScreen() {
  const user = useAuthStore((state) => state.user);
  const { notifications, unreadCount, isLoading, markAsRead, refresh } = useNotifications();
  const [tab, setTab] = useState<NotificationTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (isRefreshing || isLoading) return;
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  const visibleNotifications = tab === 'unread'
    ? notifications.filter((notification) => !notification.read)
    : notifications;

  if (!user) return <Redirect href="/" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Notifications" showBack />
      <FlatList
        data={visibleNotifications}
        keyExtractor={(notification) => notification.id}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center', flexGrow: 1 }}
        ListHeaderComponent={
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: 'Toutes', count: notifications.length },
              { value: 'unread', label: 'Non lues', count: unreadCount },
            ]}
            style={{ marginBottom: 16 }}
          />
        }
        ListEmptyComponent={isRefreshing ? null : isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.textPrimary} accessibilityLabel="Chargement des notifications" />
        ) : (
          <EmptyTabCard
            emoji={tab === 'unread' ? '✨' : '🔔'}
            title={tab === 'unread' ? 'Tout est lu !' : 'Aucune notification'}
            description={tab === 'unread'
              ? 'Les prochaines nouvelles apparaîtront ici.'
              : user.role === 'child'
                ? "Tes missions, ton argent de poche et tes réussites t'attendent ici."
                : "Retrouvez ici les nouvelles de votre famille : missions, demandes d'argent et objectifs."}
          />
        )}
        renderItem={({ item }) => {
          const config = typeConfig[item.type] ?? {
            icon: 'notifications-outline' as const,
            label: 'Notification',
            color: colors.textSecondary,
          };

          return (
            <TouchableOpacity
              onPress={() => { if (!item.read) void markAsRead(item.id); }}
              activeOpacity={item.read ? 1 : 0.7}
              accessibilityRole="button"
              accessibilityLabel={config.label + ', ' + item.title + (item.read ? ', lue' : ', non lue')}
              accessibilityHint={item.read ? undefined : 'Marquer cette notification comme lue'}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 12 }}
            >
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: config.color + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={config.icon} size={22} color={config.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>{config.label}</Text>
                  {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                </View>
                <Text style={{ fontSize: 15, fontWeight: item.read ? '600' : '800', color: colors.textPrimary, marginTop: 4 }}>{item.title}</Text>
                {!!item.body && (
                  <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 4 }}>{item.body}</Text>
                )}
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>{formatRelativeDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
