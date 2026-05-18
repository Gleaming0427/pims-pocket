/**
 * Messages utilisateur alignés sur les codes d'erreur Auth Firebase.
 * @see https://firebase.google.com/docs/reference/js/v8/firebase.auth.Error
 * @see https://firebase.google.com/docs/projects/api-keys (restrictions de clé API)
 */
type ErrorWithCode = { code?: string; message?: string };

export function getFirebaseAuthUserMessage(error: unknown): string {
  const e = error as ErrorWithCode;
  const code = typeof e?.code === 'string' ? e.code : '';

  // Les erreurs de permissions Firestore ne sont pas actionnables par
  // l'utilisateur et ne doivent pas apparaître dans une popup.
  if (typeof e?.message === 'string' && /permission.insufficient|Missing or insufficient permissions/i.test(e.message)) {
    return 'Veuillez vérifier votre email pour débloquer toutes les fonctionnalités.';
  }

  switch (code) {
    case 'auth/network-request-failed':
      return (
        'Impossible de joindre les serveurs Firebase (réseau ou configuration). ' +
        'Vérifiez la connexion, que les variables EXPO_PUBLIC_FIREBASE_* correspondent à la console Firebase, ' +
        'et dans Google Cloud > Identifiants que la clé API autorise au minimum Identity Toolkit API et Token Service API ' +
        '(voir https://firebase.google.com/docs/projects/api-keys ).'
      );
    case 'auth/invalid-api-key':
      return 'Clé API Firebase invalide. Copiez-la depuis Firebase Console > Paramètres du projet > Vos applications.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà utilisée.';
    case 'auth/weak-password':
      return 'Le mot de passe est trop faible.';
    default:
      if (typeof e?.message === 'string' && e.message.length > 0) {
        return e.message;
      }
      return 'Une erreur est survenue.';
  }
}
