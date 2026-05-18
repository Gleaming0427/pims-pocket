import { create } from 'zustand';
import { Transaction } from '@/types';
import * as firestoreLib from '@/lib/firestore';
import { captureError } from '@/lib/sentry';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (userId: string, familyId: string | undefined, role: 'parent' | 'child', childId?: string) => Promise<void>;
  sendMoney: (
    familyId: string,
    childDocId: string,
    childAuthUid: string,
    amount: number,
    type: Transaction['type'],
    description: string
  ) => Promise<void>;
  removeMoney: (
    familyId: string,
    childDocId: string,
    childAuthUid: string,
    amount: number,
    description: string
  ) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (userId, familyId, role, childId) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await firestoreLib.getTransactions(userId, familyId, role, childId);
      set({ transactions, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement';
      set({ error: message, isLoading: false });
    }
  },

  sendMoney: async (familyId, childDocId, childAuthUid, amount, type, description) => {
    set({ isLoading: true, error: null });
    try {
      await firestoreLib.sendMoney(familyId, childDocId, childAuthUid, amount, type, description);
      const transactions = await firestoreLib.getTransactions(childAuthUid, familyId, 'parent');
      set({ transactions, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur d\'envoi';
      captureError(e, 'sendMoney');
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  removeMoney: async (familyId, childDocId, childAuthUid, amount, description) => {
    set({ isLoading: true, error: null });
    try {
      await firestoreLib.removeMoney(familyId, childDocId, childAuthUid, amount, description);
      const transactions = await firestoreLib.getTransactions(childAuthUid, familyId, 'parent');
      set({ transactions, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de retrait';
      captureError(e, 'removeMoney');
      set({ error: message, isLoading: false });
      throw e;
    }
  },
}));