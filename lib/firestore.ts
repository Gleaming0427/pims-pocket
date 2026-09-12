import { db, functions } from './firebase';
import { Sentry } from './sentry';
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
  deleteDoc,
  addDoc,
  runTransaction,
  onSnapshot,
  Timestamp,
  type Query,
  type DocumentData,
} from 'firebase/firestore';
import {
  Family,
  Child,
  Transaction,
  Mission,
  Goal,
  MoneyRequest,
  AppNotification,
  EarnedBadge,
} from '@/types';
import { generateInviteCode } from '@/utils/validators';
import { httpsCallable } from 'firebase/functions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function logFirestoreError(context: string, err: unknown): void {
  const e = err as { code?: string; message?: string };
  const code = e.code ?? 'unknown';
  const msg = e.message ?? String(err);
  console.warn(`[Firestore] onSnapshot error (${context}):`, code, msg);

  // On remonte les erreurs critiques à Sentry : auth, quota, indisponibilité.
  if (
    code === 'permission-denied' ||
    code === 'unauthenticated' ||
    code === 'unavailable' ||
    code === 'resource-exhausted' ||
    code === 'deadline-exceeded'
  ) {
    Sentry.captureException(err instanceof Error ? err : new Error(msg), {
      level: 'warning',
      tags: { firestore_context: context, firestore_code: code },
    });
  }
}

function childrenCollection(familyId: string) {
  return collection(db, 'families', familyId, 'children');
}

function childDoc(familyId: string, childDocId: string) {
  return doc(db, 'families', familyId, 'children', childDocId);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function updateUserFamilyId(
  userId: string,
  familyId: string
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { familyId });
}

// ---------------------------------------------------------------------------
// Family
// ---------------------------------------------------------------------------

export async function updateUserOnboardingStatus(
  userId: string,
  hasCompleted: boolean
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { hasCompletedOnboarding: hasCompleted });
}

export async function createFamily(
  name: string,
  createdBy: string
): Promise<Family> {
  const ref = doc(collection(db, 'families'));
  const family: Omit<Family, 'id'> = {
    name,
    parentIds: [createdBy],
    createdBy,
    createdAt: Timestamp.now(),
  };
  await setDoc(ref, family);
  return { id: ref.id, ...family };
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(db, 'families', familyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Family;
}

export async function updateFamily(
  familyId: string,
  data: Partial<Family>
): Promise<void> {
  await updateDoc(doc(db, 'families', familyId), data as DocumentData);
}

export async function addParentToFamily(
  familyId: string,
  parentUid: string
): Promise<void> {
  const familyRef = doc(db, 'families', familyId);
  const snap = await getDoc(familyRef);
  if (!snap.exists()) throw new Error('Famille non trouvée');
  const family = snap.data()!;
  const parentIds: string[] = family.parentIds ?? [];
  if (!parentIds.includes(parentUid)) {
    await updateDoc(familyRef, { parentIds: [...parentIds, parentUid] });
  }
}

export function onFamilySnapshot(
  familyId: string,
  callback: (family: Family | null) => void
) {
  return onSnapshot(
    doc(db, 'families', familyId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as Family);
    },
    (err) => {
    logFirestoreError('snapshot', err);
    }
  );
}

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

export async function addChild(
  familyId: string,
  data: {
    firstName: string;
    avatarId: string;
    birthDate: Date;
    weeklyAllowance: number;
    allowanceDay: number;
  }
): Promise<Child> {
  const ref = doc(childrenCollection(familyId));
  const child: Omit<Child, 'id'> = {
    familyId,
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

export async function deleteChild(
  familyId: string,
  childDocId: string
): Promise<void> {
  await deleteDoc(childDoc(familyId, childDocId));
}

// Suppression COMPLÈTE d'un compte enfant (Auth + données), côté parent
// uniquement — gérée par la Cloud Function deleteChildAccount.
export async function deleteChildAccount(
  familyId: string,
  childDocId: string
): Promise<void> {
  const callFn = httpsCallable<
    { familyId: string; childDocId: string },
    { success?: boolean }
  >(functions, 'deleteChildAccount');
  await callFn({ familyId, childDocId });
}

export async function getChildren(familyId: string): Promise<Child[]> {
  const snap = await getDocs(childrenCollection(familyId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Child);
}

export async function getChild(
  familyId: string,
  childDocId: string
): Promise<Child | null> {
  const snap = await getDoc(childDoc(familyId, childDocId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Child;
}

export async function updateChild(
  familyId: string,
  childDocId: string,
  data: Partial<Child>
): Promise<void> {
  await updateDoc(childDoc(familyId, childDocId), data as DocumentData);
}

// L'enfant choisit sa gemme de couleur (écrit sur SON document enfant)
export async function updateChildThemeColor(
  familyId: string,
  childDocId: string,
  themeColor: string
): Promise<void> {
  await updateDoc(childDoc(familyId, childDocId), { themeColor } as DocumentData);
}

export function onChildrenSnapshot(
  familyId: string,
  callback: (children: Child[]) => void
) {
  return onSnapshot(
    childrenCollection(familyId),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Child));
    },
    (err) => {
    logFirestoreError('snapshot', err);
    }
  );
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

export async function removeMoney(
  familyId: string,
  childDocId: string,
  childAuthUid: string,
  amount: number,
  description: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const childRef = childDoc(familyId, childDocId);
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
      familyId,
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
  familyId: string,
  childDocId: string,
  childAuthUid: string,
  amount: number,
  type: Transaction['type'],
  description: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const childRef = childDoc(familyId, childDocId);
    const childSnap = await tx.get(childRef);

    if (!childSnap.exists()) throw new Error('Enfant non trouvé');

    const childData = childSnap.data()!;

    tx.update(childRef, {
      balance: (childData.balance as number) + amount,
      totalEarned: (childData.totalEarned as number) + amount,
    });

    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      familyId,
      childId: childAuthUid,
      childDocId,
      type,
      amount,
      description,
      status: 'completed',
      createdAt: Timestamp.now(),
    });

    // Notification dans la tirelire de l'enfant
    const notifRef = doc(collection(db, 'notifications'));
    tx.set(notifRef, {
      userId: childAuthUid,
      title: 'Argent reçu ! 🎉',
      body: `Tu as reçu ${(amount / 100).toFixed(2)} €${description ? ` (${description})` : ''} !`,
      type: 'money_received',
      read: false,
      createdAt: Timestamp.now(),
    });
  });
}

export async function getTransactions(
  userId: string,
  familyId: string | undefined,
  role: 'parent' | 'child',
  childId?: string,
  maxResults = 50
): Promise<Transaction[]> {
  const constraints: any[] = [orderBy('createdAt', 'desc'), limit(maxResults)];

  if (familyId) {
    constraints.unshift(where('familyId', '==', familyId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else if (role === 'parent') {
    // Rétrocompatibilité sans familyId
    constraints.unshift(where('parentId', '==', userId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else {
    constraints.unshift(where('childId', '==', userId));
  }

  const snap = await getDocs(
    query(collection(db, 'transactions'), ...constraints)
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

export function onTransactionsSnapshot(
  userId: string,
  familyId: string | undefined,
  role: 'parent' | 'child',
  childId: string | undefined,
  callback: (transactions: Transaction[]) => void,
  maxResults = 50
) {
  const constraints: any[] = [orderBy('createdAt', 'desc'), limit(maxResults)];

  if (familyId) {
    constraints.unshift(where('familyId', '==', familyId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else if (role === 'parent') {
    // Rétrocompatibilité
    constraints.unshift(where('parentId', '==', userId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else {
    constraints.unshift(where('childId', '==', userId));
  }

  return onSnapshot(
    query(collection(db, 'transactions'), ...constraints),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction));
    },
    (err) => {
    logFirestoreError('snapshot', err);
    }
  );
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export async function createMission(
  data: Omit<Mission, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'missions'), {
    ...data,
    autoApproveAt:
      typeof data.autoApproveAt === 'number'
        ? Timestamp.fromMillis(data.autoApproveAt as unknown as number)
        : data.autoApproveAt || null,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getMissions(
  userId: string,
  familyId: string | undefined,
  role: 'parent' | 'child',
  childId?: string,
  maxResults?: number
): Promise<Mission[]> {
  const constraints: any[] = [orderBy('createdAt', 'desc')];

  if (familyId) {
    constraints.unshift(where('familyId', '==', familyId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else if (role === 'parent') {
    // Rétrocompatibilité
    constraints.unshift(where('parentId', '==', userId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else {
    constraints.unshift(where('childId', '==', userId));
  }

  if (maxResults !== undefined) constraints.push(limit(maxResults));

  const snap = await getDocs(query(collection(db, 'missions'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Mission);
}

export function onMissionsSnapshot(
  userId: string,
  familyId: string | undefined,
  role: 'parent' | 'child',
  childId: string | undefined,
  callback: (missions: Mission[]) => void,
  maxResults?: number
) {
  const constraints: any[] = [orderBy('createdAt', 'desc')];

  if (familyId) {
    constraints.unshift(where('familyId', '==', familyId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else if (role === 'parent') {
    constraints.unshift(where('parentId', '==', userId));
    if (childId) constraints.push(where('childId', '==', childId));
  } else {
    constraints.unshift(where('childId', '==', userId));
  }

  if (maxResults !== undefined) constraints.push(limit(maxResults));

  return onSnapshot(
    query(collection(db, 'missions'), ...constraints),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Mission));
    },
    (err) => {
    logFirestoreError('snapshot', err);
    }
  );
}

export async function updateMission(
  missionId: string,
  data: Partial<Mission>
): Promise<void> {
  await updateDoc(doc(db, 'missions', missionId), data as DocumentData);
}

export async function deleteMission(missionId: string): Promise<void> {
  await deleteDoc(doc(db, 'missions', missionId));
}

export async function completeMission(
  missionId: string,
  mission: Mission,
  familyId: string
): Promise<void> {
  const childKey = mission.childDocId ?? mission.childId;
  await runTransaction(db, async (tx) => {
    const childRef = childDoc(familyId, childKey);
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
      familyId,
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

export async function getGoals(familyId: string, childId: string): Promise<Goal[]> {
  const snap = await getDocs(
    query(
      collection(db, 'goals'),
      where('familyId', '==', familyId),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Goal);
}

export function onGoalsSnapshot(
  familyId: string,
  childId: string,
  callback: (goals: Goal[]) => void
) {
  return onSnapshot(
    query(
      collection(db, 'goals'),
      where('familyId', '==', familyId),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc')
    ),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Goal));
    },
    (err) => {
    logFirestoreError('snapshot', err);
    }
  );
}

export async function deleteGoal(
  goalId: string,
  // Fallback : les objectifs créés avant le fix ne portent pas childDocId.
  // L'appelant (enfant) passe le sien depuis son profil.
  childDocIdFallback?: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const goalRef = doc(db, 'goals', goalId);
    const goalSnap = await tx.get(goalRef);
    if (!goalSnap.exists()) return;

    const goalData = goalSnap.data()!;
    const refundAmount = goalData.currentAmount as number;
    const childDocId = goalData.childDocId ?? childDocIdFallback;

    // Rembourse l'épargne restante au solde de l'enfant — sans ça, l'argent
    // épargné pour l'objectif serait perdu lors de la suppression.
    if (refundAmount > 0 && goalData.familyId && childDocId) {
      const childRef = childDoc(goalData.familyId, childDocId);
      const childSnap = await tx.get(childRef);
      if (childSnap.exists()) {
        const childData = childSnap.data()!;
        tx.update(childRef, {
          balance: (childData.balance as number) + refundAmount,
          totalSaved: Math.max(0, ((childData.totalSaved as number) || 0) - refundAmount),
        });

        const txRef = doc(collection(db, 'transactions'));
        tx.set(txRef, {
          familyId: goalData.familyId,
          childId: goalData.childId,
          childDocId,
          type: 'saving',
          amount: refundAmount, // positif = remboursement vers le solde
          description: `Remboursement : ${goalData.title}`,
          goalId,
          status: 'completed',
          createdAt: Timestamp.now(),
        });
      }
    }

    tx.delete(goalRef);
  });
}

export async function updateGoal(
  goalId: string,
  data: Partial<Goal>
): Promise<void> {
  await updateDoc(doc(db, 'goals', goalId), data as DocumentData);
}

export async function saveToGoal(
  goalId: string,
  familyId: string,
  childDocId: string,
  amount: number
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const childRef = childDoc(familyId, childDocId);
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
      familyId,
      childId: goalData.childId,
      childDocId,
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
  familyId: string | undefined,
  role: 'parent' | 'child'
): Promise<MoneyRequest[]> {
  const constraints: any[] = [orderBy('createdAt', 'desc')];

  if (familyId) {
    constraints.unshift(where('familyId', '==', familyId));
  } else {
    const field = role === 'parent' ? 'parentId' : 'childId';
    constraints.unshift(where(field, '==', userId));
  }

  const snap = await getDocs(
    query(collection(db, 'moneyRequests'), ...constraints)
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MoneyRequest);
}

export function onMoneyRequestsSnapshot(
  userId: string,
  familyId: string | undefined,
  role: 'parent' | 'child',
  callback: (requests: MoneyRequest[]) => void
) {
  const constraints: any[] = [orderBy('createdAt', 'desc')];

  // L'enfant ne peut lire que ses propres demandes (règles Firestore) :
  // on filtre par son UID, sans quoi la requête serait refusée.
  if (role === 'child') {
    constraints.unshift(where('childId', '==', userId));
  } else if (familyId) {
    constraints.unshift(where('familyId', '==', familyId));
  } else {
    const field = role === 'parent' ? 'parentId' : 'childId';
    constraints.unshift(where(field, '==', userId));
  }

  return onSnapshot(
    query(collection(db, 'moneyRequests'), ...constraints),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MoneyRequest));
    },
    (err) => {
    logFirestoreError('snapshot', err);
    }
  );
}

export async function resolveMoneyRequest(
  requestId: string,
  request: MoneyRequest,
  approved: boolean,
  familyId: string,
  comment?: string
): Promise<void> {
  if (approved) {
    const childKey = request.childDocId ?? request.childId;
    await runTransaction(db, async (tx) => {
      const childRef = childDoc(familyId, childKey);
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
        familyId,
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

export function onNotificationsSnapshot(
  userId: string,
  callback: (notifications: AppNotification[]) => void
) {
  return onSnapshot(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification));
    },
    (err) => {
      logFirestoreError('snapshot', err);
    }
  );
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

export function onBadgesSnapshot(
  childId: string,
  callback: (badges: EarnedBadge[]) => void
) {
  return onSnapshot(
    query(
      collection(db, 'badges'),
      where('childId', '==', childId),
      orderBy('earnedAt', 'desc')
    ),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EarnedBadge));
    },
    (err) => {
      logFirestoreError('snapshot', err);
    }
  );
}