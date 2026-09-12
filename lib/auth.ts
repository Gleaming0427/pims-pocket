import { auth, db, functions } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithCredential,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { User as AppUser } from '@/types';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';
import { getFirebaseCallableUserMessage } from '@/utils/firebaseFunctionsErrors';
import { clearAllStorage } from './securePersistence';

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<AppUser> {
  const TIMEOUT_MS = 15000;
  let cred: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>;
  try {
    cred = await Promise.race([
      createUserWithEmailAndPassword(auth, email, password),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('La requête a expiré (timeout 15s). Vérifiez votre connexion internet.')), TIMEOUT_MS)
      ),
    ]);
  } catch (e: unknown) {
    throw e;
  }

  try {
    await updateProfile(cred.user, { displayName });
  } catch {
    // Non bloquant : on continue même si le profil n'est pas mis à jour
  }

  // Créer la famille d'abord pour avoir le familyId, puis créer le doc
  // utilisateur avec familyId déjà renseigné. Évite un updateDoc ultérieur
  // qui échouerait car l'email n'est pas encore vérifié.
  const familyRef = doc(collection(db, 'families'));
  const family = {
    name: displayName,
    parentIds: [cred.user.uid],
    createdBy: cred.user.uid,
    createdAt: Timestamp.now(),
  };

  let firestoreOk = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await setDoc(familyRef, family);
      firestoreOk = true;
      break;
    } catch {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  if (!firestoreOk) {
    try { await cred.user.delete(); } catch {}
    throw new Error(
      'Votre compte a bien été créé mais nous n\'avons pas pu enregistrer vos données. ' +
      'Veuillez vérifier votre connexion internet et réessayer.'
    );
  }

  const user: AppUser = {
    id: cred.user.uid,
    email,
    displayName,
    role: 'parent',
    familyId: familyRef.id,
    hasCompletedOnboarding: false,
    consentGivenAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    _mig: {
      children: true,
      transactions: true,
      missions: true,
      goals: true,
      requests: true,
    },
  };

  firestoreOk = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await setDoc(doc(db, 'users', cred.user.uid), user);
      firestoreOk = true;
      break;
    } catch {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  if (!firestoreOk) {
    try { await cred.user.delete(); } catch {}
    throw new Error(
      'Votre compte a bien été créé mais nous n\'avons pas pu enregistrer vos données. ' +
      'Veuillez vérifier votre connexion internet et réessayer.'
    );
  }

  try {
    await sendEmailVerification(cred.user);
  } catch {}

  return { ...user, emailVerified: cred.user.emailVerified };
}

// Garde anti-brute-force (callable server-side) : check avant, fail après un
// échec, clear après un succès. La vérification du mot de passe reste celle
// de Firebase Auth — la garde ralentit et informe.
export async function parentLoginGuard(
  action: 'check' | 'fail' | 'clear',
  email: string
): Promise<void> {
  const callFn = httpsCallable(functions, 'parentLoginGuard');
  try {
    await callFn({ action, email });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'functions/resource-exhausted') {
      throw new Error(err.message || 'Trop de tentatives de connexion.');
    }
    // Autres erreurs : la garde ne bloque jamais la connexion
  }
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  // Verrouillage éventuel (5 échecs → 15 min, etc.)
  await parentLoginGuard('check', email);

  let cred: Awaited<ReturnType<typeof signInWithEmailAndPassword>>;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
  } catch (e: unknown) {
    await parentLoginGuard('fail', email).catch(() => {});
    throw e;
  }

  await parentLoginGuard('clear', email).catch(() => {});

  let snap = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null);

  if (!snap || !snap.exists()) {
    await new Promise((r) => setTimeout(r, 1500));
    snap = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null);
  }

  if (!snap || !snap.exists()) {
    // Compte Auth créé sans doc Firestore (= création via console ou API).
    // On initialise un document utilisateur minimal ; le store créera la famille.
    const minimalUser = {
      role: 'parent' as const,
      email: cred.user.email,
      displayName: cred.user.email?.split('@')[0] ?? 'Parent',
      createdAt: Timestamp.now(),
      _mig: { children: true, transactions: true, missions: true, goals: true, requests: true },
    };
    await setDoc(doc(db, 'users', cred.user.uid), minimalUser);
    return {
      id: cred.user.uid,
      ...minimalUser,
      emailVerified: cred.user.emailVerified,
    };
  }

  return {
    id: snap.id,
    ...snap.data(),
    emailVerified: cred.user.emailVerified,
  } as AppUser;
}

export async function signInChild(inviteCode: string, pin: string): Promise<AppUser> {
  let data: { token?: string; familyId?: string; childDocId?: string };
  try {
    const getToken = httpsCallable<
      { inviteCode: string; pin: string },
      { token?: string; familyId?: string; childDocId?: string }
    >(functions, 'getChildLoginToken');
    const result = await getToken({ inviteCode, pin });
    data = result.data;
  } catch (e: unknown) {
    throw new Error(getFirebaseCallableUserMessage(e));
  }

  if (!data?.token) {
    throw new Error('Le serveur n\'a pas retourné de token');
  }

  let cred: Awaited<ReturnType<typeof signInWithCustomToken>>;
  try {
    cred = await signInWithCustomToken(auth, data.token);
  } catch (e: unknown) {
    throw new Error(getFirebaseAuthUserMessage(e));
  }

  let snap = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null);
  if (!snap || !snap.exists()) {
    await new Promise((r) => setTimeout(r, 1500));
    snap = await getDoc(doc(db, 'users', cred.user.uid));
  }
  if (!snap.exists()) {
    throw new Error('Compte enfant non trouvé dans la base de données');
  }

  const userData = { id: snap.id, ...snap.data() } as AppUser;

  // Rétrocompatibilité : les comptes enfants créés avant la migration "families"
  // n'ont ni familyId ni childDocId dans leur user doc. La Cloud Function
  // getChildLoginToken les renvoie maintenant (extraite du path Firestore).
  // On les utilise pour combler les champs manquants.
  if (userData.role === 'child' && (!userData.familyId || !userData.childDocId)) {
    // Toujours écraser avec les valeurs de la Cloud Function (source de vérité)
    if (data.familyId) userData.familyId = data.familyId;
    if (data.childDocId) userData.childDocId = data.childDocId;

    // Si familyId est toujours manquant, le récupérer côté client en
    // parcourant les familles (l'enfant a le droit de lister /families).
    if (!userData.familyId && userData.childDocId) {
      try {
        const { getDocs: getDocsFn, collectionGroup: collectionGroupFn, query, where } = await import('firebase/firestore');
        const childrenSnap = await getDocsFn(query(
          collectionGroupFn(db, 'children'),
          where('linkedUserId', '==', cred.user.uid)
        ));
        if (!childrenSnap.empty) {
          const segments = childrenSnap.docs[0].ref.path.split('/');
          if (segments.length >= 2 && segments[0] === 'families') {
            userData.familyId = segments[1];
          }
        }
      } catch (e: unknown) {
        console.warn('[signInChild] Échec récupération familyId:', e instanceof Error ? e.message : String(e));
      }
    }

    // Persister dans Firestore pour les prochaines connexions
    if (userData.familyId || userData.childDocId) {
      const { updateDoc: updateUserDoc } = await import('firebase/firestore');
      const updatePayload: Record<string, string> = {};
      const existing = snap.data() || {};
      if (!existing.familyId && userData.familyId) updatePayload.familyId = userData.familyId;
      if (!existing.childDocId && userData.childDocId) updatePayload.childDocId = userData.childDocId;
      if (Object.keys(updatePayload).length > 0) {
        updateUserDoc(doc(db, 'users', cred.user.uid), updatePayload).catch(() => {});
      }
    }

    // Mettre à jour le authStore immédiatement avec les bons IDs.
    try {
      const { useAuthStore } = await import('@/stores/authStore');
      useAuthStore.getState().setUser(userData);
    } catch {
      // Non bloquant
    }
  }

  return userData;
}

export async function createChildAuthAccount(
  familyId: string,
  childDocId: string,
  inviteCode: string,
  pin: string
): Promise<{ uid: string }> {
  const createAccount = httpsCallable<
    { familyId: string; childDocId: string; inviteCode: string; pin: string },
    { success?: boolean; uid: string }
  >(functions, 'createChildAccount');
  const result = await createAccount({ familyId, childDocId, inviteCode, pin });
  const data = result.data;
  return { uid: data.uid };
}

// Réinitialisation du PIN d'un enfant par son parent (rotation du secret)
export async function resetChildPin(
  familyId: string,
  childDocId: string,
  newPin: string
): Promise<void> {
  const callFn = httpsCallable<
    { familyId: string; childDocId: string; newPin: string },
    { success?: boolean }
  >(functions, 'resetChildPin');
  await callFn({ familyId, childDocId, newPin });
}

export async function signInWithGoogle(idToken: string): Promise<AppUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  const snap = await getDoc(doc(db, 'users', result.user.uid));

  if (snap.exists()) {
    return { id: snap.id, ...snap.data(), emailVerified: true } as AppUser;
  }

  const user: AppUser = {
    id: result.user.uid,
    email: result.user.email ?? '',
    displayName: result.user.displayName ?? '',
    role: 'parent',
    hasCompletedOnboarding: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    emailVerified: true, // Google = vérifié par construction
  };

  await setDoc(doc(db, 'users', result.user.uid), user);
  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
  // Nettoyer le stockage local (SecureStore + AsyncStorage) pour
  // supprimer les tokens persistés et éviter que l'utilisateur
  // reste connecté automatiquement lors du prochain lancement.
  await clearAllStorage();
}

export async function sendParentEmailVerification(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Aucun utilisateur connecté.');
  await sendEmailVerification(user);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserData(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AppUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
