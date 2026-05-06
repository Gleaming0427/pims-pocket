import { firebase, auth, db, functions } from './firebase';
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
import { User as AppUser } from '@/types';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';
import { getFirebaseCallableUserMessage } from '@/utils/firebaseFunctionsErrors';

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<AppUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  const user: AppUser = {
    id: cred.user.uid,
    email,
    displayName,
    role: 'parent',
    createdAt: firebase.firestore.Timestamp.now(),
    updatedAt: firebase.firestore.Timestamp.now(),
  };

  await db.collection('users').doc(cred.user.uid).set(user);
  return user;
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  let cred: Awaited<ReturnType<typeof signInWithEmailAndPassword>>;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
  } catch (e: unknown) {
    throw e;
  }

  // Première tentative de lecture Firestore
  let snap = await db.collection('users').doc(cred.user.uid).get().catch(() => null);

  // Retry après 1.5s si le document n'existe pas encore
  if (!snap || !snap.exists) {
    await new Promise((r) => setTimeout(r, 1500));
    snap = await db.collection('users').doc(cred.user.uid).get().catch(() => null);
  }

  if (!snap || !snap.exists) {
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
    const getToken = functions.httpsCallable('getChildLoginToken');
    const result = await getToken({ inviteCode, pin });
    data = result.data as { token?: string };
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

  let snap = await db.collection('users').doc(cred.user.uid).get().catch(() => null);
  if (!snap || !snap.exists) {
    await new Promise((r) => setTimeout(r, 1500));
    snap = await db.collection('users').doc(cred.user.uid).get();
  }
  if (!snap.exists) {
    throw new Error('Compte enfant non trouvé dans la base de données');
  }

  return { id: snap.id, ...snap.data() } as AppUser;
}

export async function createChildAuthAccount(
  childDocId: string,
  inviteCode: string,
  pin: string
): Promise<{ uid: string }> {
  const createAccount = functions.httpsCallable('createChildAccount');
  const result = await createAccount({ childDocId, inviteCode, pin });
  const data = result.data as { success?: boolean; uid: string };
  return { uid: data.uid };
}

export async function signInWithGoogle(idToken: string): Promise<AppUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  const snap = await db.collection('users').doc(result.user.uid).get();

  if (snap.exists) {
    return { id: snap.id, ...snap.data() } as AppUser;
  }

  const user: AppUser = {
    id: result.user.uid,
    email: result.user.email ?? '',
    displayName: result.user.displayName ?? '',
    role: 'parent',
    createdAt: firebase.firestore.Timestamp.now(),
    updatedAt: firebase.firestore.Timestamp.now(),
  };

  await db.collection('users').doc(result.user.uid).set(user);
  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserData(uid: string): Promise<AppUser | null> {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as AppUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
