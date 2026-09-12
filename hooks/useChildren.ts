import { useEffect } from 'react';
import { useChildStore } from '@/stores/childStore';
import { useAuthStore } from '@/stores/authStore';
import { onChildrenSnapshot } from '@/lib/firestore';
import { subscribeCached } from '@/lib/snapshotCache';

export function useChildren() {
  const store = useChildStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || user.role !== 'parent' || !user.familyId) return;

    const familyId = user.familyId; // narrowing conservé dans la closure
    const key = `children|${familyId}`;
    const unsubscribe = subscribeCached(key, () =>
      onChildrenSnapshot(familyId, (children) => {
        store.setChildren(children);
      })
    );

    return unsubscribe;
  }, [user?.id, user?.familyId]);

  return store;
}