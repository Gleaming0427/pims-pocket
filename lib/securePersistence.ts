/**
 * Adaptateur de persistance Firebase Auth.
 *
 * Priorité : expo-secure-store (Keychain/Keystore chiffré)
 * Fallback : AsyncStorage (stockage en clair)
 *
 * Après avoir ajouté expo-secure-store, il faut rebuilder le dev client
 * pour que le module natif soit lié :
 *   npx expo run:ios    # ou
 *   npx expo run:android
 */
import type { ReactNativeAsyncStorage } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

let _SecureStore: typeof import('expo-secure-store') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _SecureStore = require('expo-secure-store');
} catch {
  // Module natif non lié : on utilise AsyncStorage en attendant le rebuild
  console.warn('[SecurePersistence] expo-secure-store non disponible, utilisation d\'AsyncStorage.');
}

const securePersistence: ReactNativeAsyncStorage = {
  getItem: async (key: string) => {
    if (_SecureStore) {
      return (await _SecureStore.getItemAsync(key)) ?? null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (_SecureStore) {
      await _SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (_SecureStore) {
      await _SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

export default securePersistence;