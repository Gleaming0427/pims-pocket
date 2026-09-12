import { create } from 'zustand';
import colors from '@/constants/colors';

/**
 * Couleur d'accent choisie par l'enfant (gemme de couleur).
 * Valeur par défaut : turquoise (colors.secondary).
 * Synchronisée avec le champ `themeColor` du document enfant.
 */
interface ChildThemeState {
  accent: string;
  setAccent: (color: string) => void;
}

export const useChildThemeStore = create<ChildThemeState>((set) => ({
  accent: colors.secondary,
  setAccent: (accent) => set({ accent }),
}));
