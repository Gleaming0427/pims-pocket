import { useRef } from 'react';
import { PanResponder } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Glisser le doigt vers la droite (swipe horizontal) depuis un onglet racine
 * (Validations, Historique, Réglages) ramène à l'accueil.
 *
 * Le PanResponder ne s'active que si le mouvement est nettement horizontal
 * pour ne jamais gêner le scroll vertical des listes.
 */
export function useSwipeToHome() {
  const router = useRouter();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dx > 24 && gesture.dx > Math.abs(gesture.dy) * 1.5,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx > 60) {
          router.navigate('/(parent)/dashboard');
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
}
