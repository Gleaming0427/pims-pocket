import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { onAuthChange, getUserData } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id === firebaseUser.uid) {
          return;
        }

        let userData = await getUserData(firebaseUser.uid).catch(() => null);
        if (!userData) {
          await wait(1500);
          userData = await getUserData(firebaseUser.uid).catch(() => null);
        }
        if (!userData) {
          const existing = await getDoc(doc(db, 'users', firebaseUser.uid)).catch(() => null);
          if (existing && existing.exists()) {
            userData = { id: existing.id, ...existing.data() } as any;
          }
          // Ne pas créer de document utilisateur côté client.
          // Les comptes parent sont créés via signUp (register.tsx),
          // les comptes enfant via la Cloud Function createChildAccount.
        }
        store.setUser(userData);
      } else {
        store.setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  return store;
}