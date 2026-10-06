import { AvatarDefinition } from '@/types';
import colors from '@/constants/colors';

const avatars: AvatarDefinition[] = [
  { id: 'lion', name: 'Lion', color: colors.accent },
  { id: 'cat', name: 'Chat', color: colors.primaryLight },
  { id: 'dog', name: 'Chien', color: colors.info },
  { id: 'unicorn', name: 'Licorne', color: colors.avatarPink },
  { id: 'dragon', name: 'Dragon', color: colors.success },
  { id: 'panda', name: 'Panda', color: colors.textSecondary },
  { id: 'fox', name: 'Renard', color: colors.accentOrange },
  { id: 'rabbit', name: 'Lapin', color: colors.avatarPink },
  { id: 'owl', name: 'Hibou', color: colors.primary },
  { id: 'dolphin', name: 'Dauphin', color: colors.secondary },
  { id: 'butterfly', name: 'Papillon', color: colors.primaryLight },
  { id: 'rocket', name: 'Fusée', color: colors.error },
];

export default avatars;
