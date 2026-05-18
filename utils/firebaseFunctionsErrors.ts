import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';

type AnyErr = { code?: string; message?: string; details?: unknown };

function detailsToString(details: unknown): string {
  if (details == null) return '';
  if (typeof details === 'string') return details;
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

/**
 * Extrait le message utilisateur d'une erreur FirebaseError émanant de `httpsCallable`.
 *
 * La FirebaseError issue de `httpsCallable` peut contenir dans sa propriété
 * `details` l'erreur JSON renvoyée par le backend (Cloud Function).
 *
 * Exemple de structure :
 *   {
 *     code: 'functions/internal',
 *     message: 'internal',
 *     details: { code: 'NOT_FOUND', message: "Code d'invitation introuvable." }
 *   }
 */
export function getFirebaseCallableUserMessage(error: unknown): string {
  const e = error as AnyErr;
  const code = typeof e.code === 'string' ? e.code : '';
  const baseMsg = typeof e.message === 'string' ? e.message : '';
  const detailStr = detailsToString(e.details);

  // ── Décoder les détails d'erreur venant du backend ──
  let backendCode: string | undefined;
  let backendMsg: string | undefined;
  if (e.details && typeof e.details === 'object' && 'code' in e.details && 'message' in e.details) {
    const d = e.details as Record<string, unknown>;
    backendCode = typeof d.code === 'string' ? d.code : undefined;
    backendMsg = typeof d.message === 'string' ? d.message : undefined;
  }
  const bestMsg = backendMsg || baseMsg;
  const bestCode = backendCode || code;

  // ── Codes frontend (functions/*) ──
  if (code === 'functions/not-found' || bestCode === 'NOT_FOUND') {
    return bestMsg || 'Code d\'invitation introuvable. Vérifie le code à 6 chiffres donné par ton parent.';
  }
  if (code === 'functions/failed-precondition' || bestCode === 'FAILED_PRECONDITION') {
    return (bestMsg || 'Le compte enfant n\'est pas encore activé. Demande à ton parent de finaliser la création du compte.');
  }
  if (code === 'functions/permission-denied' || bestCode === 'PERMISSION_DENIED') {
    return bestMsg || 'Accès refusé.';
  }
  if (code === 'functions/unauthenticated' || bestCode === 'UNAUTHENTICATED') {
    return bestMsg || 'Code ou PIN invalide.';
  }
  if (code === 'functions/invalid-argument' || bestCode === 'INVALID_ARGUMENT') {
    return bestMsg || 'Paramètres invalides. Vérifie ton code (6 chiffres) et ton PIN (4 chiffres).';
  }
  if (code === 'functions/already-exists' || bestCode === 'ALREADY_EXISTS') {
    return bestMsg || 'Ce compte enfant est déjà activé.';
  }
  if (code === 'functions/resource-exhausted' || bestCode === 'RESOURCE_EXHAUSTED') {
    return bestMsg || 'Trop de tentatives. Réessaie dans quelques minutes.';
  }

  if (code === 'functions/internal' || baseMsg === 'internal') {
    if (bestMsg && bestMsg !== 'internal') {
      return bestMsg.slice(0, 600);
    }
    return (
      'Le service de connexion enfant a échoué (erreur interne). ' +
      'Vérifiez surtout : 1) index Firestore déployés et prêts (firebase deploy --only firestore:indexes), ' +
      '2) les logs de la fonction getChildLoginToken dans Firebase Console > Functions.'
    );
  }

  if (code.startsWith('functions/')) {
    return (detailStr || baseMsg || 'Erreur Cloud Functions.').slice(0, 600);
  }

  return baseMsg || getFirebaseAuthUserMessage(error);
}
