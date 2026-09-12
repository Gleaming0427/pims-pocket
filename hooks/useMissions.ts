import { useEffect } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import { useAuthStore } from '@/stores/authStore';
import { onMissionsSnapshot } from '@/lib/firestore';
import { subscribeCached } from '@/lib/snapshotCache';

export function useMissions(childId?: string, maxResults?: number) {
  const store = useMissionStore();
  const user = useAuthStore((s) => s.user);

  // L'enfant doit toujours filtrer par son propre childId (Auth UID)
  // pour que la query respecte les règles Firestore.
  const effectiveChildId =
    childId ?? (user?.role === 'child' ? user.id : undefined);

  useEffect(() => {
    if (!user) return;
    store.fetchMissions(user.id, user.familyId, user.role, effectiveChildId, maxResults);

    const key = `missions|${user.id}|${user.familyId ?? ''}|${user.role}|${effectiveChildId ?? ''}|${maxResults ?? ''}`;
    const unsub = subscribeCached(key, () =>
      onMissionsSnapshot(user.id, user.familyId, user.role, effectiveChildId, (missions) => {
        store.setMissions(missions);
      }, maxResults)
    );

    return () => {
      unsub();
    };
  }, [user?.id, user?.familyId, effectiveChildId, maxResults]);

  return store;
}