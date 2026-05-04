/**
 * Firebase – API compat (firebase v10, React Native).
 *
 * Le polyfill react-native-url-polyfill/auto est chargé dans index.ts AVANT ce module.
 * La persistance Auth utilise securePersistence (expo-secure-store → AsyncStorage fallback).
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function trimEnv(v: string | undefined): string {
  return (v ?? '').trim().replace(/^\uFEFF/, '');
}

const firebaseConfig = {
  apiKey: trimEnv(process.env.EXPO_PUBLIC_FIREBASE_API_KEY) || 'MISSING_API_KEY',
  authDomain:
    trimEnv(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN) || 'MISSING_AUTH_DOMAIN',
  projectId:
    trimEnv(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) || 'MISSING_PROJECT_ID',
  storageBucket:
    trimEnv(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
    'MISSING_STORAGE_BUCKET',
  messagingSenderId:
    trimEnv(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
    'MISSING_SENDER_ID',
  appId: trimEnv(process.env.EXPO_PUBLIC_FIREBASE_APP_ID) || 'MISSING_APP_ID',
};

if (__DEV__) {
  const hasMissing =
    firebaseConfig.apiKey === 'MISSING_API_KEY' ||
    firebaseConfig.projectId === 'MISSING_PROJECT_ID' ||
    firebaseConfig.authDomain === 'MISSING_AUTH_DOMAIN';
  if (hasMissing) {
    console.error(
      '[Firebase] Variables EXPO_PUBLIC_FIREBASE_* manquantes. ' +
        'Crée un .env à la racine avec les clés Firebase puis relance Metro : npx expo start -c'
    );
  }
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const app = firebase.app();

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const auth = app.auth();
export const db = app.firestore();
export const functions = app.functions('europe-west1');

export { firebase };
export default firebase;