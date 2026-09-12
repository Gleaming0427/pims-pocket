import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export type Timestamp = firebase.firestore.Timestamp;

export interface Family {
  id: string;
  name: string;
  parentIds: string[];
  createdBy: string;
  createdAt: Timestamp;
  autoValidateMissions?: boolean;
  validationDelayHours?: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'parent' | 'child';
  // Identifiant de la famille (pour parents et enfants). Sera obligatoire
  // après migration, optionnel pour rétrocompatibilité.
  familyId?: string;
  parentId?: string;
  // ID du sous-doc enfant chez le parent (users/{parentId}/children/{childDocId}).
  // Renseigné par la Cloud Function createChildAccount uniquement pour role='child'.
  childDocId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fcmToken?: string;
  emailVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  consentGivenAt?: Timestamp;
}

export interface Child {
  id: string;
  familyId?: string;
  firstName: string;
  avatarId: string;
  birthDate: Timestamp;
  balance: number;
  totalEarned: number;
  totalSaved: number;
  weeklyAllowance: number;
  allowanceDay: number;
  spendingLimit?: number;
  linkedUserId?: string;
  inviteCode?: string;
  // Gemme de couleur choisie par l'enfant (hex, ex. '#00CEC9')
  themeColor?: string;
  createdAt: Timestamp;
}

export type TransactionType =
  | 'allowance'
  | 'mission_reward'
  | 'bonus'
  | 'gift'
  | 'saving'
  | 'spending'
  | 'request'
  | 'penalty';

export interface Transaction {
  id: string;
  familyId?: string;
  parentId?: string;
  // childId = linkedUserId (Auth UID de l'enfant) — pour queries + rules.
  childId: string;
  // childDocId = ID du sous-doc enfant — pour mutations balance.
  childDocId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  missionId?: string;
  goalId?: string;
  status: 'completed' | 'pending';
  createdAt: Timestamp;
}

export type MissionStatus =
  | 'available'
  | 'in_progress'
  | 'pending_validation'
  | 'completed'
  | 'expired';

export interface Mission {
  id: string;
  familyId?: string;
  parentId?: string;
  // childId = linkedUserId (Auth UID de l'enfant). Sert aux queries côté
  // enfant et aux Firestore Rules (resource.data.childId == request.auth.uid).
  childId: string;
  // childDocId = ID du sous-doc enfant — sert aux mutations balance.
  childDocId?: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  status: MissionStatus;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  autoValidate?: boolean;
  autoApproveAt?: Timestamp;
  createdAt: Timestamp;
}

export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface Goal {
  id: string;
  familyId?: string;
  childId: string;
  // ID du sous-doc enfant — nécessaire pour le remboursement à la suppression
  childDocId?: string;
  parentId?: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  imageUrl?: string;
  status: GoalStatus;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface EarnedBadge {
  id: string;
  childId: string;
  badgeType: string;
  earnedAt: Timestamp;
}

export type NotificationType =
  | 'new_mission'
  | 'mission_completed'
  | 'money_received'
  | 'goal_reached'
  | 'money_request'
  | 'validation_needed'
  | 'allowance_sent'
  | 'badge_earned'
  | 'welcome';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  data?: Record<string, string>;
  createdAt: Timestamp;
}

export type MoneyRequestStatus = 'pending' | 'approved' | 'rejected';

export interface MoneyRequest {
  id: string;
  familyId?: string;
  // childId = linkedUserId (Auth UID) — pour queries + rules.
  childId: string;
  // childDocId = ID du sous-doc enfant — pour incrément balance à l'approbation.
  childDocId?: string;
  parentId?: string;
  amount: number;
  reason: string;
  status: MoneyRequestStatus;
  parentComment?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  emoji: string;
  condition: string;
}

export interface AvatarDefinition {
  id: string;
  name: string;
  emoji: string;
  color: string;
}
