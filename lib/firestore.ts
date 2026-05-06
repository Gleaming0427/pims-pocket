import { db } from './firebase';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  runTransaction,
  onSnapshot,
  Timestamp,
  type Query,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore';
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function childrenCollection(parentId: string) {
  return collection(db, 'users', parentId, 'children');
}

function childDoc(parentId: string, childId: string) {
  return doc(db, 'users', parentId, 'children', childId);
}

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

export async function addChild(
  parentId: string,
  data: {
    firstName: string;
    avatarId: string;
    birthDate: Date;
    weeklyAllowance: number;
    allowanceDay: number;
  }
): Promise<Child> {
  const ref = doc(childrenCollection(parentId));
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
  await setDoc(ref, child);
  return { id: ref.id, ...child } as Child;
}

export async function getChildren(parentId: string): Promise<Child[]> {
  const snap = await getDocs(childrenCollection(parentId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Child);
}

export async function getChild(
  parentId: string,
  childId: string
): Promise<Child | null> {
  const snap = await getDoc(childDoc(parentId, childId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Child;
}

export async function updateChild(
  parentId: string,
  childId: string,
  data: Partial<Child>
): Promise<void> {
  await updateDoc(childDoc(parentId, childId), data as DocumentData);
}

export function onChildrenSnapshot(
  parentId: string,
  callback: (children: Child[]) => void
) {
  return onSnapshot(childrenCollection(parentId), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Child));
  });
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function createTransaction(
  data: Omit<Transaction, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'transactions'), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

/**
 * Retire de l'argent au solde de l'enfant (sanction, bêtise, etc.).
 * Ne décrémente pas totalEarned (qui est cumulatif sur la vie du compte).
 * Le solde ne peut pas devenir négatif : on plafonne à 0.
 */
export async function removeMoney(
  parentId: string,
  childDocId: string,
  childAuthUid: string,
  amount: number,
  description: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const childRef = childDoc(parentId, childDocId);
    const childSnap = await tx.get(childRef);

    if (!childSnap.exists()) throw new Error('Enfant non trouvé');

    const childData = childSnap.data()!;
    const currentBalance = childData.balance as number;
    const effective = Math.min(amount, currentBalance);

    if (effective <= 0) {
      throw new Error('Solde déjà à zéro, rien à retirer.');
    }

    tx.update(childRef, {
      balance: currentBalance - effective,
    });

    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      parentId,
      childId: childAuthUid,
      childDocId,
      type: 'penalty',
      amount: effective,
      description,
      status: 'completed',
      createdAt: Timestamp.now(),
    });
  });
}

export async function sendMoney(
  parentId: string,
  childDocId: string,
  childAuthUid: string,
  amount: number,
  type: Transaction['type'],
  description: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const childRef = childDoc(parentId, childDocId);
    const childSnap = await tx.get(childRef);

    if (!childSnap.exists()) throw new Error('Enfant non trouvé');

    const childData = childSnap.data()!;

    tx.update(childRef, {
      balance: (childData.balance as number) + amount,
      totalEarned: (childData.totalEarned as number) + amount,
    });

    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      parentId,
      childId: childAuthUid,
      childDocId,
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
  let q: Query = query(
    collection(db, 'transactions'),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  if (role === 'parent') {
    q = query(
      collection(db, 'transactions'),
      where('parentId', '==', userId),
      ...(childId ? [where('childId', '==', childId)] : []),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
  } else {
    q = query(
      collection(db, 'transactions'),
      where('childId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export async function createMission(
  data: Omit<Mission, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'missions'), {
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
  const constraints: any[] = [orderBy('createdAt', 'desc')];

  if (role === 'parent') {
    constraints.unshift(where('parentId', '==', userId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else {
    constraints.unshift(where('childId', '==', userId));
  }

  const snap = await getDocs(query(collection(db, 'missions'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Mission);
}

export async function updateMission(
  missionId: string,
  data: Partial<Mission>
): Promise<void> {
  await updateDoc(doc(db, 'missions', missionId), data as DocumentData);
}

export async function completeMission(
  missionId: string,
  mission: Mission,
  parentId: string
): Promise<void> {
  // Le sous-doc enfant est repéré par childDocId. Pour les missions créées
  // avant l'introduction de childDocId, on tombe sur childId par compat
  // (legacy, peut ne pas correspondre).
  const childKey = mission.childDocId ?? mission.childId;
  await runTransaction(db, async (tx) => {
    const childRef = childDoc(parentId, childKey);
    const childSnap = await tx.get(childRef);

    if (!childSnap.exists()) throw new Error('Enfant non trouvé');

    const childData = childSnap.data()!;

    tx.update(doc(db, 'missions', missionId), {
      status: 'completed',
      completedAt: Timestamp.now(),
    });

    tx.update(childRef, {
      balance: (childData.balance as number) + mission.reward,
      totalEarned: (childData.totalEarned as number) + mission.reward,
    });

    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      parentId,
      childId: mission.childId,
      childDocId: childKey,
      type: 'mission_reward',
      amount: mission.reward,
      description: `Mission : ${mission.title}`,
      missionId,
      status: 'completed',
      createdAt: Timestamp.now(),
    });
  });
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function createGoal(data: Omit<Goal, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'goals'), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getGoals(childId: string): Promise<Goal[]> {
  const snap = await getDocs(
    query(
      collection(db, 'goals'),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Goal);
}

export async function saveToGoal(
  goalId: string,
  parentId: string,
  childId: string,
  amount: number
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const childRef = childDoc(parentId, childId);
    const goalRef = doc(db, 'goals', goalId);

    const childSnap = await tx.get(childRef);
    const goalSnap = await tx.get(goalRef);

    if (!childSnap.exists()) throw new Error('Enfant non trouvé');
    if (!goalSnap.exists()) throw new Error('Objectif non trouvé');

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
      ...(isCompleted
        ? { status: 'completed', completedAt: Timestamp.now() }
        : {}),
    });

    const txRef = doc(collection(db, 'transactions'));
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

// ---------------------------------------------------------------------------
// Money Requests
// ---------------------------------------------------------------------------

export async function createMoneyRequest(
  data: Omit<MoneyRequest, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'moneyRequests'), {
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
  const snap = await getDocs(
    query(
      collection(db, 'moneyRequests'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MoneyRequest);
}

export async function resolveMoneyRequest(
  requestId: string,
  request: MoneyRequest,
  approved: boolean,
  comment?: string
): Promise<void> {
  if (approved) {
    // Pour mettre à jour le solde, on a besoin du childDocId (clé du sous-doc).
    // Fallback sur childId pour les anciennes demandes créées avant l'ajout
    // du champ childDocId.
    const childKey = request.childDocId ?? request.childId;
    await runTransaction(db, async (tx) => {
      const childRef = childDoc(request.parentId, childKey);
      const childSnap = await tx.get(childRef);

      if (!childSnap.exists()) throw new Error('Enfant non trouvé');

      const childData = childSnap.data()!;

      tx.update(doc(db, 'moneyRequests', requestId), {
        status: 'approved',
        parentComment: comment || null,
        resolvedAt: Timestamp.now(),
      });

      tx.update(childRef, {
        balance: (childData.balance as number) + request.amount,
        totalEarned: (childData.totalEarned as number) + request.amount,
      });

      const txRef = doc(collection(db, 'transactions'));
      tx.set(txRef, {
        parentId: request.parentId,
        childId: request.childId,
        childDocId: childKey,
        type: 'request',
        amount: request.amount,
        description: `Demande : ${request.reason}`,
        status: 'completed',
        createdAt: Timestamp.now(),
      });
    });
  } else {
    await updateDoc(doc(db, 'moneyRequests', requestId), {
      status: 'rejected',
      parentComment: comment || null,
      resolvedAt: Timestamp.now(),
    });
  }
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getNotifications(
  userId: string
): Promise<AppNotification[]> {
  const snap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification);
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
}

export async function createNotification(
  data: Omit<AppNotification, 'id'>
): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export async function getEarnedBadges(childId: string): Promise<EarnedBadge[]> {
  const snap = await getDocs(
    query(
      collection(db, 'badges'),
      where('childId', '==', childId),
      orderBy('earnedAt', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EarnedBadge);
}