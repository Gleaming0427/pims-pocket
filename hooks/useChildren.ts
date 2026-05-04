import { useEffect } from 'react';
import { useChildStore } from '@/stores/childStore';
import { useAuthStore } from '@/stores/authStore';
import { onChildrenSnapshot } from '@/lib/firestore';

export function useChildren() {
  const store = useChildStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || user.role !== 'parent') return;

    const unsubscribe = onChildrenSnapshot(user.id, (children) => {
      store.setChildren(children);
    });

    return unsubscribe;
  }, [user?.id]);

  return store;
}
