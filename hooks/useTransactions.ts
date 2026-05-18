import { useEffect } from 'react';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';

export function useTransactions(childId?: string) {
  const store = useTransactionStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    store.fetchTransactions(user.id, user.familyId, user.role, childId);
  }, [user?.id, user?.familyId, childId]);

  return store;
}