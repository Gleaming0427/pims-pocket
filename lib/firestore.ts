import { firebase, db } from './firebase';
import {
  Child,
  Transaction,
  Mission,
  Goal,
  MoneyRequest,
  AppNotification,
  EarnedBadge,
} from '@/types';
import { generateInviteCode } from '@/utils/validators';

const FieldValue = firebase.firestore.FieldValue;
const Timestamp = firebase.firestore.Timestamp;

// --- Children ---

export async function addChild(parentId: string, data: {
  firstName: string;
  avatarId: string;
  birthDate: Date;
  weeklyAllowance: number;
  allowanceDay: number;
}): Promise<Child> {
  const ref = db.collection('users').doc(parentId).collection('children').doc();
  const child: Omit<Child, 'id'> = {
    firstName: data.firstName,
    avatarId: data.avatarId,
    birthDate: Timestamp.fromDate(data.birthDate),
    balance: 0,
    totalEarned: 0,
    totalSaved: 0,
    weeklyAllowance: data.weeklyAllowance,
    allowanceDay: data.allowanceDay,
    inviteCode: generateInviteCode(),
    createdAt: Timestamp.now(),
  };
  await ref.set(child);
  return { id: ref.id, ...child } as Child;
}

export async function getChildren(parentId: string): Promise<Child[]> {
  const snap = await db.collection('users').doc(parentId).collection('children').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Child);
}

export async function getChild(parentId: string, childId: string): Promise<Child | null> {
  const snap = await db.collection('users').doc(parentId).collection('children').doc(childId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Child;
}

export async function updateChild(
  parentId: string,
  childId: string,
  data: Partial<Child>
): Promise<void> {
  await db.collection('users').doc(parentId).collection('children').doc(childId).update(data as Record<string, unknown>);
}

export function onChildrenSnapshot(
  parentId: string,
  callback: (children: Child[]) => void
) {
  return db.collection('users').doc(parentId).collection('children')
    .onSnapshot((snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Child));
    });
}

// --- Transactions ---

export async function createTransaction(data: Omit<Transaction, 'id'>): Promise<string> {
  const ref = await db.collection('transactions').add({
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function sendMoney(
  parentId: string,
  childId: string,
  amount: number,
  type: Transaction['type'],
  description: string
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const childRef = db.collection('users').doc(parentId).collection('children').doc(childId);
    const childSnap = await tx.get(childRef);

    if (!childSnap.exists) throw new Error('Enfant non trouvé');

    const childData = childSnap.data()!;

    tx.update(childRef, {
      balance: (childData.balance as number) + amount,
      totalEarned: (childData.totalEarned as number) + amount,
    });

    const txRef = db.collection('transactions').doc();
    tx.set(txRef, {
      parentId,
      childId,
      type,
      amount,
      description,
      status: 'completed',
      createdAt: Timestamp.now(),
    });
  });
}

export async function getTransactions(
  userId: string,
  role: 'parent' | 'child',
  childId?: string,
  maxResults = 50
): Promise<Transaction[]> {
  let q: firebase.firestore.Query = db.collection('transactions');

  if (role === 'parent') {
    q = q.where('parentId', '==', userId);
    if (childId) q = q.where('childId', '==', childId);
  } else {
    q = q.where('childId', '==', userId);
  }

  q = q.orderBy('createdAt', 'desc').limit(maxResults);

  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

// --- Missions ---

export async function createMission(data: Omit<Mission, 'id'>): Promise<string> {
  const ref = await db.collection('missions').add({
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getMissions(
  userId: string,
  role: 'parent' | 'child',
  childId?: string
): Promise<Mission[]> {
  let q: firebase.firestore.Query = db.collection('missions');

  if (role === 'parent') {
    q = q.where('parentId', '==', userId);
    if (childId) q = q.where('childId', '==', childId);
  } else {
    q = q.where('childId', '==', userId);
  }

  q = q.orderBy('createdAt', 'desc');

  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Mission);
}

export async function updateMission(
  missionId: string,
  data: Partial<Mission>
): Promise<void> {
  await db.collection('missions').doc(missionId).update(data as Record<string, unknown>);
}

export async function completeMission(
  missionId: string,
  mission: Mission,
  parentId: string
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const childRef = db.collection('users').doc(parentId).collection('children').doc(mission.childId);
    const childSnap = await tx.get(childRef);

    if (!childSnap.exists) throw new Error('Enfant non trouvé');

    const childData = childSnap.data()!;

    tx.update(db.collection('missions').doc(missionId), {
      status: 'completed',
      completedAt: Timestamp.now(),
    });

    tx.update(childRef, {
      balance: (childData.balance as number) + mission.reward,
      totalEarned: (childData.totalEarned as number) + mission.reward,
    });

    const txRef = db.collection('transactions').doc();
    tx.set(txRef, {
      parentId,
      childId: mission.childId,
      type: 'mission_reward',
      amount: mission.reward,
      description: `Mission : ${mission.title}`,
      missionId,
      status: 'completed',
      createdAt: Timestamp.now(),
    });
  });
}

// --- Goals ---

export async function createGoal(data: Omit<Goal, 'id'>): Promise<string> {
  const ref = await db.collection('goals').add({
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getGoals(childId: string): Promise<Goal[]> {
  const snap = await db.collection('goals')
    .where('childId', '==', childId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Goal);
}

export async function saveToGoal(
  goalId: string,
  parentId: string,
  childId: string,
  amount: number
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const childRef = db.collection('users').doc(parentId).collection('children').doc(childId);
    const goalRef = db.collection('goals').doc(goalId);

    const childSnap = await tx.get(childRef);
    const goalSnap = await tx.get(goalRef);

    if (!childSnap.exists) throw new Error('Enfant non trouvé');
    if (!goalSnap.exists) throw new Error('Objectif non trouvé');

    const childData = childSnap.data()!;
    const goalData = goalSnap.data()!;

    if ((childData.balance as number) < amount) {
      throw new Error('Solde insuffisant');
    }

    const newGoalAmount = (goalData.currentAmount as number) + amount;
    const isCompleted = newGoalAmount >= (goalData.targetAmount as number);

    tx.update(childRef, {
      balance: (childData.balance as number) - amount,
      totalSaved: ((childData.totalSaved as number) || 0) + amount,
    });

    tx.update(goalRef, {
      currentAmount: newGoalAmount,
      ...(isCompleted ? { status: 'completed', completedAt: Timestamp.now() } : {}),
    });

    const txRef = db.collection('transactions').doc();
    tx.set(txRef, {
      parentId,
      childId,
      type: 'saving',
      amount: -amount,
      description: `Épargne : ${goalData.title}`,
      goalId,
      status: 'completed',
      createdAt: Timestamp.now(),
    });
  });
}

// --- Money Requests ---

export async function createMoneyRequest(data: Omit<MoneyRequest, 'id'>): Promise<string> {
  const ref = await db.collection('moneyRequests').add({
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getMoneyRequests(
  userId: string,
  role: 'parent' | 'child'
): Promise<MoneyRequest[]> {
  const field = role === 'parent' ? 'parentId' : 'childId';
  const snap = await db.collection('moneyRequests')
    .where(field, '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MoneyRequest);
}

export async function resolveMoneyRequest(
  requestId: string,
  request: MoneyRequest,
  approved: boolean,
  comment?: string
): Promise<void> {
  if (approved) {
    await db.runTransaction(async (tx) => {
      const childRef = db.collection('users').doc(request.parentId).collection('children').doc(request.childId);
      const childSnap = await tx.get(childRef);

      if (!childSnap.exists) throw new Error('Enfant non trouvé');

      const childData = childSnap.data()!;

      tx.update(db.collection('moneyRequests').doc(requestId), {
        status: 'approved',
        parentComment: comment || null,
        resolvedAt: Timestamp.now(),
      });

      tx.update(childRef, {
        balance: (childData.balance as number) + request.amount,
        totalEarned: (childData.totalEarned as number) + request.amount,
      });

      const txRef = db.collection('transactions').doc();
      tx.set(txRef, {
        parentId: request.parentId,
        childId: request.childId,
        type: 'request',
        amount: request.amount,
        description: `Demande : ${request.reason}`,
        status: 'completed',
        createdAt: Timestamp.now(),
      });
    });
  } else {
    await db.collection('moneyRequests').doc(requestId).update({
      status: 'rejected',
      parentComment: comment || null,
      resolvedAt: Timestamp.now(),
    });
  }
}

// --- Notifications ---

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const snap = await db.collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification);
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await db.collection('notifications').doc(notifId).update({ read: true });
}

export async function createNotification(data: Omit<AppNotification, 'id'>): Promise<void> {
  await db.collection('notifications').add({
    ...data,
    createdAt: Timestamp.now(),
  });
}

// --- Badges ---

export async function getEarnedBadges(childId: string): Promise<EarnedBadge[]> {
  const snap = await db.collection('badges')
    .where('childId', '==', childId)
    .orderBy('earnedAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EarnedBadge);
}
