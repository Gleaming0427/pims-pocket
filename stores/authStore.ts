import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, Family } from '@/types';
import * as authLib from '@/lib/auth';
import * as firestoreLib from '@/lib/firestore';
import { setSentryUser, clearSentryUser, captureError } from '@/lib/sentry';

// Adaptateur expo-secure-store pour Zustand persist.
// expo-secure-store chiffre les données (Keychain sur iOS, Android Keystore)
// contrairement à AsyncStorage qui stocke en clair.
const secureStoreAdapter: StateStorage = {
  getItem: async (name) => SecureStore.getItemAsync(name),
  setItem: async (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: async (name) => SecureStore.deleteItemAsync(name),
};

interface AuthState {
  user: User | null;
  family: Family | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  fetchFamily: (familyId: string) => Promise<void>;
  updateFamilySettings: (data: Partial<Family>) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInChild: (inviteCode: string, pin: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      family: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  setUser: (user) => {
    if (user) {
      // RGPD / Google Families Policy : ne pas envoyer de PII enfant à Sentry
      if (user.role === 'child') {
        clearSentryUser();
      } else {
        setSentryUser(user.id, user.role, user.email);
      }
    } else {
      clearSentryUser();
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  fetchFamily: async (familyId) => {
    try {
      const family = await firestoreLib.getFamily(familyId);
      set({ family });
    } catch {
      set({ family: null });
    }
  },

  updateFamilySettings: async (data) => {
    const state = get();
    if (!state.family?.id) return;
    await firestoreLib.updateFamily(state.family.id, data);
    set({ family: { ...state.family, ...data } });
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authLib.signUp(email, password, displayName);
      // La famille est créée dans authLib.signUp, avec le familyId déjà
      // renseigné sur le doc utilisateur. Il ne reste qu'à la fetcher.
      const family = user.familyId ? await firestoreLib.getFamily(user.familyId) : null;
      set({ user, family, isAuthenticated: true, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur lors de l\'inscription';
      captureError(e, 'signUp');
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authLib.signIn(email, password);

      if (!user.familyId && user.role === 'parent') {
        // Rétrocompatibilité : les anciens comptes n'ont pas de familyId
        const { getDocs, collection, query, where, doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const familiesSnap = await getDocs(
          query(collection(db, 'families'), where('parentIds', 'array-contains', user.id))
        );
        if (!familiesSnap.empty) {
          const familyId = familiesSnap.docs[0].id;
          await updateDoc(doc(db, 'users', user.id), { familyId }).catch(() => {});
          const userWithFamily = { ...user, familyId };
          const family = await firestoreLib.getFamily(familyId);
          set({ user: userWithFamily, family, isAuthenticated: true, isLoading: false });
          return;
        }
        // Aucune famille trouvée → en créer une nouvelle (vieux comptes)
        const family = await firestoreLib.createFamily(user.displayName || 'Ma Famille', user.id);
        await firestoreLib.updateUserFamilyId(user.id, family.id);
        const userWithFamily = { ...user, familyId: family.id };
        set({ user: userWithFamily, family, isAuthenticated: true, isLoading: false });
        return;
      }

      if (user.familyId) {
        const family = await firestoreLib.getFamily(user.familyId);
        set({ user, family: family || null, isAuthenticated: true, isLoading: false });
      } else {
        set({ user, isAuthenticated: true, isLoading: false });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de connexion';
      captureError(e, 'signIn');
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  signInWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authLib.signInWithGoogle(idToken);

      // Si l'utilisateur n'a pas encore de familyId associé, créer une famille
      if (!user.familyId && user.role === 'parent') {
        const family = await firestoreLib.createFamily(user.displayName || 'Ma Famille', user.id);
        await firestoreLib.updateUserFamilyId(user.id, family.id);
        const userWithFamily = { ...user, familyId: family.id };
        set({ user: userWithFamily, family, isAuthenticated: true, isLoading: false });
      } else if (user.familyId) {
        const family = await firestoreLib.getFamily(user.familyId);
        set({ user, family: family || null, isAuthenticated: true, isLoading: false });
      } else {
        set({ user, isAuthenticated: true, isLoading: false });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de connexion Google';
      captureError(e, 'signInWithGoogle');
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  signInChild: async (inviteCode, pin) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authLib.signInChild(inviteCode, pin);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Code ou PIN invalide';
      captureError(e, 'signInChild');
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authLib.signOut();
      set({ user: null, family: null, isAuthenticated: false, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de déconnexion';
      set({ error: message, isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authLib.resetPassword(email);
      set({ isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  resendVerificationEmail: async () => {
    try {
      await authLib.sendParentEmailVerification();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur d\'envoi';
      set({ error: message });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
    }),
    {
      name: 'pimspocket-auth',
      storage: createJSONStorage(() => secureStoreAdapter),
      partialize: (state) => ({
        user: state.user,
        family: state.family,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);