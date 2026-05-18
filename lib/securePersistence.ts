/**
 * Nettoyage du stockage local lors de la déconnexion.
 *
 * Firebase Auth persiste les tokens dans AsyncStorage via
 * `getReactNativePersistence(AsyncStorage)`. Le store Zustand
 * (user, family) est chiffré dans expo-secure-store.
 *
 * À la déconnexion, on vide les deux pour supprimer toute trace
 * de session et empêcher la reconnexion automatique au prochain
 * lancement.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export async function clearAllStorage(): Promise<void> {
  await AsyncStorage.clear();
  try {
    await SecureStore.deleteItemAsync('pimspocket-auth');
  } catch {
    // Non bloquant : si la clé n'existe pas, on ignore
  }
  if (__DEV__) {
    console.log('[SecurePersistence] Stockage local vidé.');
  }
}