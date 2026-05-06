import { auth, db, functions } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithCredential,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
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

  const user: AppUser = {
    id: cred.user.uid,
    email,
    displayName,
    role: 'parent',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  let firestoreOk = false;
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
    try {
      await cred.user.delete();
    } catch {
      // Rollback best-effort
    }
    throw new Error(
      'Votre compte a bien été créé mais nous n\'avons pas pu enregistrer vos données. ' +
      'Veuillez vérifier votre connexion internet et réessayer.'
    );
  }

  return user;
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  let cred: Awaited<ReturnType<typeof signInWithEmailAndPassword>>;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
  } catch (e: unknown) {
    throw e;
  }

  let snap = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null);

  if (!snap || !snap.exists()) {
    await new Promise((r) => setTimeout(r, 1500));
    snap = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null);
  }

  if (!snap || !snap.exists()) {
    throw new Error(
      'Votre compte est bien créé mais les données mettent quelques secondes à se synchroniser. ' +
      'Veuillez réessayer dans 5 secondes.'
    );
  }

  return { id: snap.id, ...snap.data() } as AppUser;
}

export async function signInChild(inviteCode: string, pin: string): Promise<AppUser> {
  let data: { token?: string };
  try {
    const getToken = httpsCallable<{ inviteCode: string; pin: string }, { token?: string }>(functions, 'getChildLoginToken');
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

  return { id: snap.id, ...snap.data() } as AppUser;
}

export async function createChildAuthAccount(
  childDocId: string,
  inviteCode: string,
  pin: string
): Promise<{ uid: string }> {
  const createAccount = httpsCallable<{ childDocId: string; inviteCode: string; pin: string }, { success?: boolean; uid: string }>(functions, 'createChildAccount');
  const result = await createAccount({ childDocId, inviteCode, pin });
  const data = result.data;
  return { uid: data.uid };
}

export async function signInWithGoogle(idToken: string): Promise<AppUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  const snap = await getDoc(doc(db, 'users', result.user.uid));

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as AppUser;
  }

  const user: AppUser = {
    id: result.user.uid,
    email: result.user.email ?? '',
    displayName: result.user.displayName ?? '',
    role: 'parent',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
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
