import { BadgeDefinition } from '@/types';

const badges: BadgeDefinition[] = [
  {
    id: 'first_mission',
    name: 'Première mission',
    description: 'Compléter sa première mission',
    icon: 'star',
    emoji: '🌟',
    condition: 'complete_first_mission',
  },
  {
    id: 'first_saver',
    name: 'Petit épargnant',
    description: 'Atteindre un premier objectif d\'épargne',
    icon: 'cash',
    emoji: '💰',
    condition: 'reach_first_goal',
  },
  {
    id: 'streak_5',
    name: 'En série !',
    description: '5 missions d\'affilée',
    icon: 'flame',
    emoji: '🔥',
    condition: 'complete_5_streak',
  },
  {
    id: 'super_saver',
    name: 'Super épargnant',
    description: '50€ épargnés au total',
    icon: 'trophy',
    emoji: '🏆',
    condition: 'save_5000_cents',
  },
  {
    id: 'regular',
    name: 'Régulier',
    description: 'Missions complétées 4 semaines de suite',
    icon: 'calendar',
    emoji: '📅',
    condition: 'complete_4_weeks',
  },
  {
    id: 'goal_reached',
    name: 'Objectif atteint',
    description: 'Atteindre un objectif d\'épargne',
    icon: 'flag',
    emoji: '🎯',
    condition: 'reach_goal',
  },
  {
    id: 'collector',
    name: 'Collectionneur',
    description: 'Obtenir 10 badges',
    icon: 'diamond',
    emoji: '💎',
    condition: 'earn_10_badges',
  },
];

export default badges;
