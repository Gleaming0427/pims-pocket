import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '@/types';
import { formatRelativeDate } from '@/utils/formatters';
import EmptyState from '@/components/shared/EmptyState';
import colors from '@/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  mission_completed: { icon: 'checkbox-outline', label: 'Mission validée', color: colors.success },
  money_received: { icon: 'cash-outline', label: 'Argent reçu', color: colors.primary },
  goal_reached: { icon: 'flag-outline', label: 'Objectif atteint', color: colors.starGold },
  money_request: { icon: 'hand-left-outline', label: "Demande d'argent", color: colors.piggyPink },
  validation_needed: { icon: 'checkmark-circle-outline', label: 'À valider', color: colors.warning },
  allowance_sent: { icon: 'calendar-outline', label: 'Argent de poche', color: colors.accentOrange },
  badge_earned: { icon: 'ribbon-outline', label: 'Badge obtenu', color: colors.starGold },
};

export default function NotificationsModal({
  visible,
  onClose,
  notifications,
  loading,
  onMarkAsRead,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              emoji="🔔"
              title="Aucune notification"
              description="Vous recevrez des notifications quand vos enfants accomplissent des missions ou demandent de l'argent."
            />
          }
          renderItem={({ item }) => {
            const config = TYPE_CONFIG[item.type] ?? {
              icon: 'notifications-outline',
              label: 'Notification',
              color: colors.textSecondary,
            };

            return (
              <TouchableOpacity
                style={[styles.notifItem, !item.read && styles.notifUnread]}
                onPress={() => onMarkAsRead(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: config.color + '20' }]}>
                  <Ionicons name={config.icon as any} size={22} color={config.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifType}>{config.label}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  {item.body ? (
                    <Text style={styles.notifBody} numberOfLines={2}>
                      {item.body}
                    </Text>
                  ) : null}
                  <Text style={styles.notifDate}>
                    {formatRelativeDate(item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  notifUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notifType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  notifBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notifDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
});