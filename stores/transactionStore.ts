import { create } from 'zustand';
import { Transaction } from '@/types';
import * as firestoreLib from '@/lib/firestore';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (userId: string, role: 'parent' | 'child', childId?: string) => Promise<void>;
  sendMoney: (
    parentId: string,
    childId: string,
    amount: number,
    type: Transaction['type'],
    description: string
  ) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (userId, role, childId) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await firestoreLib.getTransactions(userId, role, childId);
      set({ transactions, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement';
      set({ error: message, isLoading: false });
    }
  },

  sendMoney: async (parentId, childId, amount, type, description) => {
    set({ isLoading: true, error: null });
    try {
      await firestoreLib.sendMoney(parentId, childId, amount, type, description);
      const transactions = await firestoreLib.getTransactions(parentId, 'parent');
      set({ transactions, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur d\'envoi';
      set({ error: message, isLoading: false });
      throw e;
    }
  },
}));
