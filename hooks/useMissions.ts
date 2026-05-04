import { useEffect } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import { useAuthStore } from '@/stores/authStore';

export function useMissions(childId?: string) {
  const store = useMissionStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    store.fetchMissions(user.id, user.role, childId);
  }, [user?.id, childId]);

  return store;
}
