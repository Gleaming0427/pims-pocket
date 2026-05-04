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
  console.log('[signIn] Début connexion:', email);
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY!;

  // Test REST direct (diagnostic)
  try {
    const restResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    console.log('[signIn] REST test statut:', restResp.status);
    if (restResp.ok) {
      const restData = await restResp.json();
      console.log('[signIn] REST OK, localId:', restData.localId);
    } else {
      const errText = await restResp.text().catch(() => '?');
      console.error('[signIn] REST échec', restResp.status, errText.substring(0, 200));
    }
  } catch (restErr: unknown) {
    const msg = restErr instanceof Error ? restErr.message : String(restErr);
    console.error('[signIn] REST fetch erreur réseau:', msg);
  }

  let cred: Awaited<ReturnType<typeof signInWithEmailAndPassword>>;
  try {
    cred = await signInWithEmailAndPassword(auth, email, password);
    console.log('[signIn] SDK Auth OK, uid:', cred.user.uid);
  } catch (e: unknown) {
    const code = (e as { code?: string }).code ?? 'code_inconnu';
    const message = (e as { message?: string }).message ?? 'message_inconnu';
    const errAny = e as Record<string, unknown>;
    console.error(`[signIn] Erreur SDK Auth: code=${code} message=${message}`);
    // Logger toutes les clés accessibles sans getter qui pète
    const safeKeys = ['code', 'message', 'name', 'customData', 'stack'];
    for (const k of safeKeys) {
      try {
        const v = errAny[k];
        if (v !== undefined) console.error(`[signIn]   ${k}:`, typeof v === 'object' ? JSON.stringify(Object.keys(v as object)) : String(v));
      } catch { /* ignore */ }
    }
    throw e;
  }

  // Première tentative de lecture Firestore
  let snap = await db.collection('users').doc(cred.user.uid).get().catch((e) => {
    const code = (e as { code?: string }).code ?? 'code_inconnu';
    const message = (e as { message?: string }).message ?? 'message_inconnu';
    console.error(`[signIn] Erreur lecture Firestore (1ère tentative): code=${code} message=${message}`);
    return null;
  });

  // Retry après 1.5s si le document n'existe pas encore
  if (!snap || !snap.exists) {
    console.log('[signIn] Document non trouvé, retry dans 1.5s...');
    await new Promise((r) => setTimeout(r, 1500));
    snap = await db.collection('users').doc(cred.user.uid).get().catch((e) => {
      const code = (e as { code?: string }).code ?? 'code_inconnu';
      const message = (e as { message?: string }).message ?? 'message_inconnu';
      console.error(`[signIn] Erreur lecture Firestore (2ème tentative): code=${code} message=${message}`);
      return null;
    });
  }

  if (!snap || !snap.exists) {
    console.error('[signIn] Utilisateur Firestore introuvable après 2 tentatives, uid:', cred.user.uid);
    throw new Error(
      'Votre compte est bien créé mais les données mettent quelques secondes à se synchroniser. ' +
      'Veuillez réessayer dans 5 secondes.'
    );
  }

  console.log('[signIn] ✅ Connexion réussie');
  return { id: snap.id, ...snap.data() } as AppUser;
}

export async function signInChild(inviteCode: string, pin: string): Promise<AppUser> {
  console.log('[signInChild] Début appel getChildLoginToken', { inviteCode, pin: '****' });
  let data: { token?: string };
  try {
    const getToken = functions.httpsCallable('getChildLoginToken');
    console.log('[signInChild] Calling httpsCallable...');
    const result = await getToken({ inviteCode, pin });
    console.log('[signInChild] Résultat reçu:', JSON.stringify(result.data));
    data = result.data as { token?: string };
  } catch (e: unknown) {
    const allKeys = [
      ...Object.getOwnPropertyNames(e),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(e)),
      ...(e instanceof Error ? Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(e))) : []),
    ];
    console.error('[signInChild] Erreur brute:', JSON.stringify(e, [...new Set(allKeys)]));
    // Tenter d'accéder à details même si pas dans Object.getOwnPropertyNames
    const details = (e as Record<string, unknown>).details;
    if (details !== undefined) {
      console.error('[signInChild] Détails erreur:', JSON.stringify(details));
    }
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
