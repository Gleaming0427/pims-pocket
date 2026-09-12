/**
 * Gemmes de couleurs disponibles côté enfant.
 * Chaque enfant peut choisir sa gemme dans son profil — boutons, cards,
 * héro et onglet actif prennent la couleur choisie.
 */
export interface ChildTheme {
  id: string;
  label: string;
  color: string;
}

export const CHILD_THEMES: ChildTheme[] = [
  { id: 'turquoise', label: 'Turquoise', color: '#00CEC9' },
  { id: 'violet', label: 'Violet', color: '#6C5CE7' },
  { id: 'rose', label: 'Rose', color: '#FF6B9D' },
  { id: 'orange', label: 'Orange', color: '#F39C12' },
  { id: 'vert', label: 'Vert', color: '#00B894' },
  { id: 'bleu', label: 'Bleu', color: '#74B9FF' },
];

export function isThemeColor(color: string | undefined): color is string {
  return !!color && CHILD_THEMES.some((t) => t.color === color);
}
