/**
 * Nettoyage du stockage local lors de la déconnexion.
 *
 * Firebase Auth persiste les tokens dans AsyncStorage via
 * `getReactNativePersistence(AsyncStorage)`.
 *
 * À la déconnexion, on vide AsyncStorage pour supprimer ces tokens
 * et empêcher la reconnexion automatique au prochain lancement.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearAllStorage(): Promise<void> {
  await AsyncStorage.clear();
  if (__DEV__) {
    console.log('[SecurePersistence] Stockage local vidé.');
  }
}