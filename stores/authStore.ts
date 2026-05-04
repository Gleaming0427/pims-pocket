import { create } from 'zustand';
import { User } from '@/types';
import * as authLib from '@/lib/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInChild: (inviteCode: string, pin: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  signUp: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authLib.signUp(email, password, displayName);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur lors de l\'inscription';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authLib.signIn(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de connexion';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  signInWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authLib.signInWithGoogle(idToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de connexion Google';
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
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authLib.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
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

  clearError: () => set({ error: null }),
}));
