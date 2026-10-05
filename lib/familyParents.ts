import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/lib/firebase';
import { getFirebaseCallableUserMessage } from '@/utils/firebaseFunctionsErrors';

/**
 * Co-parents : inviter un autre parent dans la famille, rejoindre une famille
 * avec un code, lister et retirer des parents. Tout passe par des Cloud
 * Functions (les règles Firestore interdisent de s'ajouter soi-même).
 */

export interface FamilyParent {
  uid: string;
  displayName: string;
  email: string;
  isMe: boolean;
  isCreator: boolean;
}

export interface ParentInvite {
  code: string;
  // Fin de validité (millisecondes)
  expiresAt: number;
}

async function call<Req, Res>(name: string, data?: Req): Promise<Res> {
  // Sans jeton valide, le SDK envoie l'appel sans identification et le serveur
  // répond « unauthenticated » : on vérifie le jeton d'abord pour donner un
  // message clair (le plus souvent : pas de connexion internet).
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Ta session a expiré. Déconnecte-toi puis reconnecte-toi.');
  }
  try {
    await currentUser.getIdToken();
  } catch {
    throw new Error('Connexion impossible. Vérifie ta connexion internet et réessaie.');
  }
  try {
    const result = await httpsCallable<Req, Res>(functions, name)(data as Req);
    return result.data;
  } catch (e: unknown) {
    throw new Error(getFirebaseCallableUserMessage(e));
  }
}

// Code d'invitation de la famille (renvoie celui encore valable s'il existe)
export function createParentInvite(): Promise<ParentInvite> {
  return call<void, ParentInvite>('createParentInvite');
}

// Rejoindre la famille d'un autre parent ; renvoie l'ID de la famille rejointe
export function joinFamilyWithCode(code: string): Promise<{ familyId: string }> {
  return call<{ code: string }, { familyId: string }>('joinFamilyWithCode', {
    code: code.trim().toUpperCase(),
  });
}

export async function getFamilyParents(): Promise<FamilyParent[]> {
  const { parents } = await call<void, { parents: FamilyParent[] }>('getFamilyParents');
  return parents;
}

// Retirer un parent (ou soi-même). En se retirant soi-même, on reçoit l'ID de
// sa nouvelle famille, vide.
export function removeFamilyParent(targetUid: string): Promise<{ familyId?: string }> {
  return call<{ targetUid: string }, { familyId?: string }>('removeFamilyParent', { targetUid });
}
