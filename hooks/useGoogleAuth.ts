import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';

WebBrowser.maybeCompleteAuthSession();

const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function useGoogleAuth() {
  const router = useRouter();
  const { signInWithGoogle, isLoading } = useAuthStore();

  // Lazy-import to avoid crash when clientId is undefined
  const Google = require('expo-auth-session/providers/google');

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
    iosClientId: clientId,
    androidClientId: clientId,
  });

  const handleGoogleSignIn = useCallback(async (idToken: string) => {
    try {
      await signInWithGoogle(idToken);
      router.replace('/');
    } catch (e: unknown) {
      Alert.alert('Erreur', getFirebaseAuthUserMessage(e));
    }
  }, [signInWithGoogle, router]);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        handleGoogleSignIn(idToken);
      }
    }
  }, [response, handleGoogleSignIn]);

  return {
    promptAsync,
    isReady: !!request && !!clientId,
    isLoading,
  };
}
