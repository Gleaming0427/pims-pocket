import { create } from 'zustand';
import { Mission } from '@/types';
import * as firestoreLib from '@/lib/firestore';
import { captureError } from '@/lib/sentry';
import { Timestamp } from 'firebase/firestore';

interface MissionState {
  missions: Mission[];
  isLoading: boolean;
  error: string | null;
  fetchMissions: (userId: string, familyId: string | undefined, role: 'parent' | 'child', childId?: string) => Promise<void>;
  setMissions: (missions: Mission[]) => void;
  createMission: (data: Omit<Mission, 'id'>) => Promise<string>;
  updateMissionStatus: (missionId: string, status: Mission['status']) => Promise<void>;
  completeMission: (missionId: string, mission: Mission, familyId: string) => Promise<void>;
  getPendingValidations: () => Mission[];
}

export const useMissionStore = create<MissionState>((set, get) => ({
  missions: [],
  isLoading: false,
  error: null,

  fetchMissions: async (userId, familyId, role, childId) => {
    set({ isLoading: true, error: null });
    try {
      const missions = await firestoreLib.getMissions(userId, familyId, role, childId);
      set({ missions, isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement';
      set({ error: message, isLoading: false });
    }
  },

  setMissions: (missions: Mission[]) => {
    set({ missions, isLoading: false });
  },

  createMission: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const id = await firestoreLib.createMission(data);
      const newMission: Mission = { ...data, id, createdAt: Timestamp.now() };
      set((state) => {
        // Le snapshot onMissionsSnapshot peut avoir déjà inséré la mission
        if (state.missions.some((m) => m.id === id)) {
          return { isLoading: false };
        }
        return {
          missions: [newMission, ...state.missions],
          isLoading: false,
        };
      });
      return id;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  updateMissionStatus: async (missionId, status) => {
    try {
      await firestoreLib.updateMission(missionId, { status });
      set((state) => ({
        missions: state.missions.map((m) =>
          m.id === missionId ? { ...m, status } : m
        ),
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur';
      set({ error: message });
    }
  },

  completeMission: async (missionId, mission, familyId) => {
    set({ isLoading: true });
    try {
      await firestoreLib.completeMission(missionId, mission, familyId);
      set((state) => ({
        missions: state.missions.map((m) =>
          m.id === missionId
            ? { ...m, status: 'completed' as const, completedAt: Timestamp.now() }
            : m
        ),
        isLoading: false,
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur';
      captureError(e, 'completeMission');
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  getPendingValidations: () => {
    return get().missions.filter((m) => m.status === 'pending_validation');
  },
}));