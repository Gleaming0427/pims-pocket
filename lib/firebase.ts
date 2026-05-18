/**
 * Firebase – Initialisation pour React Native (Expo).
 *
 * Configuration : variables EXPO_PUBLIC_FIREBASE_* dans .env (Firebase prod).
 *
 * Auth : initializeAuth + getReactNativePersistence(AsyncStorage) — c'est la
 * méthode officielle Firebase pour React Native (persistance entre redémarrages
 * de l'app). Sans ça, l'utilisateur est déconnecté à chaque relance.
 *
 * Émulateurs locaux : si EXPO_PUBLIC_USE_EMULATORS=true, redirige tous les
 * appels vers les émulateurs locaux (firebase emulators:start). Sinon, prod.
 *
 * Prérequis : `react-native-url-polyfill/auto` importé dans index.ts AVANT
 * ce module (indispensable au SDK Firebase JS en React Native).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  connectAuthEmulator,
  type Auth,
  type Persistence,
} from 'firebase/auth';
// getReactNativePersistence est exporté par le bundle RN de @firebase/auth
// mais absent du fichier de types public (index.d.ts cible le web). On
// l'importe via un require typé manuellement — Metro résout vers le bundle RN
// grâce au resolver custom de metro.config.js.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: unknown) => Persistence;
};
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const USE_EMULATORS = process.env.EXPO_PUBLIC_USE_EMULATORS === 'true';

if (__DEV__) {
  const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    console.error(
      `[Firebase] ⚠️  Variables manquantes : ${missing.join(', ')}. ` +
      `Vérifie ton .env puis relance Metro avec : npx expo start -c`
    );
  }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ---------------------------------------------------------------------------
// Auth (avec persistance AsyncStorage)
//
// initializeAuth ne peut être appelé qu'une fois. Au hot-reload, on retombe
// sur getAuth() pour récupérer l'instance existante.
// ---------------------------------------------------------------------------

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: unknown) {
  if ((e as { code?: string }).code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Firestore & Functions
// ---------------------------------------------------------------------------

const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app, 'europe-west1');

// ---------------------------------------------------------------------------
// Émulateurs (dev local uniquement)
// ---------------------------------------------------------------------------

if (USE_EMULATORS) {
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? 'localhost';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
  if (__DEV__) {
    console.log(`[Firebase] 🔶 Émulateurs connectés (host: ${host})`);
  }
}


export { app, auth, db, functions };
export default app;
