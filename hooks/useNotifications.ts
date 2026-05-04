import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AppNotification } from '@/types';
import {
  getNotifications,
  markNotificationRead,
} from '@/lib/firestore';
import {
  registerForPushNotifications,
  addNotificationListener,
  addNotificationResponseListener,
} from '@/lib/notifications';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const notifs = await getNotifications(user.id);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch {
      // silent fail for notifications
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notifId: string) => {
    try {
      await markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    void registerForPushNotifications(user.id).catch(() => {});
    fetchNotifications();

    const notifSub = addNotificationListener(() => {
      fetchNotifications();
    });

    const responseSub = addNotificationResponseListener(() => {
      fetchNotifications();
    });

    return () => {
      notifSub.remove();
      responseSub.remove();
    };
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    refresh: fetchNotifications,
  };
}
