import { create } from 'zustand';
import { Child } from '@/types';
import * as firestoreLib from '@/lib/firestore';

interface ChildState {
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;
  fetchChildren: (familyId: string) => Promise<void>;
  addChild: (familyId: string, data: {
    firstName: string;
    avatarId: string;
    birthDate: Date;
    weeklyAllowance: number;
    allowanceDay: number;
  }) => Promise<Child>;
  updateChild: (familyId: string, childDocId: string, data: Partial<Child>) => Promise<void>;
  deleteChild: (familyId: string, childDocId: string) => Promise<void>;
  selectChild: (child: Child | null) => void;
  setChildren: (children: Child[]) => void;
}

export const useChildStore = create<ChildState>((set, get) => ({
  children: [],
  selectedChild: null,
  isLoading: false,
  error: null,

  fetchChildren: async (familyId) => {
    set({ isLoading: true, error: null });
    try {
      const children = await firestoreLib.getChildren(familyId);
      set({ children, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement';
      set({ error: message, isLoading: false });
    }
  },

  addChild: async (familyId, data) => {
    set({ isLoading: true, error: null });
    try {
      const child = await firestoreLib.addChild(familyId, data);
      // Re-fetch pour avoir la liste complète
      const children = await firestoreLib.getChildren(familyId);
      set({ children, isLoading: false });
      return child;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  updateChild: async (familyId, childDocId, data) => {
    try {
      await firestoreLib.updateChild(familyId, childDocId, data);
      set((state) => ({
        children: state.children.map((c) =>
          c.id === childDocId ? { ...c, ...data } : c
        ),
        selectedChild:
          state.selectedChild?.id === childDocId
            ? { ...state.selectedChild, ...data }
            : state.selectedChild,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de mise à jour';
      set({ error: message });
    }
  },

  deleteChild: async (familyId, childDocId) => {
    try {
      await firestoreLib.deleteChild(familyId, childDocId);
      set((state) => ({
        children: state.children.filter((c) => c.id !== childDocId),
        selectedChild:
          state.selectedChild?.id === childDocId ? null : state.selectedChild,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de suppression';
      set({ error: message });
      throw e;
    }
  },

  selectChild: (child) => set({ selectedChild: child }),

  setChildren: (children) => set({ children }),
}));