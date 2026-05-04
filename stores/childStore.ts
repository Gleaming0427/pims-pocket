import { create } from 'zustand';
import { Child } from '@/types';
import * as firestoreLib from '@/lib/firestore';

interface ChildState {
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;
  fetchChildren: (parentId: string) => Promise<void>;
  addChild: (parentId: string, data: {
    firstName: string;
    avatarId: string;
    birthDate: Date;
    weeklyAllowance: number;
    allowanceDay: number;
  }) => Promise<Child>;
  updateChild: (parentId: string, childId: string, data: Partial<Child>) => Promise<void>;
  selectChild: (child: Child | null) => void;
  setChildren: (children: Child[]) => void;
}

export const useChildStore = create<ChildState>((set, get) => ({
  children: [],
  selectedChild: null,
  isLoading: false,
  error: null,

  fetchChildren: async (parentId) => {
    set({ isLoading: true, error: null });
    try {
      const children = await firestoreLib.getChildren(parentId);
      set({ children, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement';
      set({ error: message, isLoading: false });
    }
  },

  addChild: async (parentId, data) => {
    set({ isLoading: true, error: null });
    try {
      const child = await firestoreLib.addChild(parentId, data);
      set({ isLoading: false });
      return child;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  updateChild: async (parentId, childId, data) => {
    try {
      await firestoreLib.updateChild(parentId, childId, data);
      set((state) => ({
        children: state.children.map((c) =>
          c.id === childId ? { ...c, ...data } : c
        ),
        selectedChild:
          state.selectedChild?.id === childId
            ? { ...state.selectedChild, ...data }
            : state.selectedChild,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de mise à jour';
      set({ error: message });
    }
  },

  selectChild: (child) => set({ selectedChild: child }),

  setChildren: (children) => set({ children }),
}));
