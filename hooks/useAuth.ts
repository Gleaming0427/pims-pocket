import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { onAuthChange, getUserData } from '@/lib/auth';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { migrateLegacyParentData } from '@/lib/migrations/legacyToFamily';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const currentUser = useAuthStore.getState().user;

        // S'assurer que isLoading passe à false même si le user est déjà dans le store
        // (isLoading n'est pas persisté par Zustand → true par défaut au démarrage)
        if (currentUser && currentUser.id === firebaseUser.uid) {
          store.setUser(currentUser);
          return;
        }

        let userData = await getUserData(firebaseUser.uid).catch(() => null);
        if (!userData) {
          await wait(1500);
          userData = await getUserData(firebaseUser.uid).catch(() => null);
        }
        if (!userData) {
          const existing = await getDoc(doc(db, 'users', firebaseUser.uid)).catch(
            () => null
          );
          if (existing && existing.exists()) {
            userData = { id: existing.id, ...existing.data() } as any;
          }
        }

        // Injecter emailVerified depuis Firebase Auth (pas stocké dans Firestore)
        if (userData) {
          userData.emailVerified = firebaseUser.emailVerified;
        }

        // ─── Helpers (hoisted via function declarations) ───

        async function setUserWithFamilyData(
          u: any,
          familyId: string,
          childDocId: string,
          uid: string
        ) {
          const merged = { ...u, familyId, childDocId };
          store.setUser(merged);
          // Persister dans Firestore pour les prochains démarrages
          if (!u.familyId || !u.childDocId) {
            const payload: Record<string, string> = {};
            if (!u.familyId) payload.familyId = familyId;
            if (!u.childDocId) payload.childDocId = childDocId;
            updateDoc(doc(db, 'users', uid), payload).catch(() => {});
          }
        }

        async function recoverChildFamilyInfo(u: any, uid: string) {
          // 1) Essayer côté client d'abord : collectionGroup children où
          //    linkedUserId == uid. L'enfant a le droit de lire son propre
          //    doc (isLinkedChild). Plus rapide et ne dépend pas des CF.
          try {
            const { getDocs, collectionGroup, query, where } = await import('firebase/firestore');
            const childrenSnap = await getDocs(query(
              collectionGroup(db, 'children'),
              where('linkedUserId', '==', uid)
            ));
            if (!childrenSnap.empty) {
              const docData = childrenSnap.docs[0].data();
              const pathSegments = childrenSnap.docs[0].ref.path.split('/');
              // path = families/{familyId}/children/{childDocId}
              const fid = pathSegments.length >= 2 && pathSegments[0] === 'families'
                ? pathSegments[1]
                : docData.familyId;
              const cid = pathSegments.length >= 4 && pathSegments[0] === 'families'
                ? pathSegments[3]
                : childrenSnap.docs[0].id;
              if (fid) {
                setUserWithFamilyData(u, fid, cid, uid);
                return;
              }
            }
          } catch {
            // Continue vers le fallback Cloud Function
          }

          // 2) Fallback Cloud Function
          const { httpsCallable, getFunctions } = await import('firebase/functions');
          const { app } = await import('@/lib/firebase');
          const functionsInstance = getFunctions(app, 'europe-west1');
          const callFn = httpsCallable<
            Record<string, never>,
            {
              familyId?: string;
              childDocId?: string;
              balance?: number;
              avatarId?: string | null;
              firstName?: string | null;
            }
          >(functionsInstance, 'getChildFamilyInfo');

          try {
            const result = await callFn({});
            const data = result.data;
            if (data?.familyId && data?.childDocId) {
              setUserWithFamilyData(u, data.familyId, data.childDocId, uid);
              return;
            }
          } catch {
            // Échec → ne pas écraser un store déjà complet
          }

          // 3) En dernier recours, ne rien faire plutôt que d'écraser
          //    avec un user incomplet. Le store sera rempli par
          //    signInChild entre-temps.
          const storeUser = useAuthStore.getState().user;
          if (!storeUser || storeUser.id !== uid || !storeUser.familyId || !storeUser.childDocId) {
            store.setUser(u);
          }
        }

        /**
         * Fallback côté client : quand l'enfant a familyId mais pas childDocId,
         * on cherche le document enfant dans families/{familyId}/children dont
         * linkedUserId == auth.uid.
         *
         * Plus rapide et ne dépend pas du déploiement des Cloud Functions.
         */
        async function clientRecoverChildDocId(
          u: any,
          uid: string,
          familyId: string
        ) {
          try {
            const childrenSnap = await getDocs(
              query(
                collection(db, 'families', familyId, 'children'),
                where('linkedUserId', '==', uid)
              )
            );
            if (!childrenSnap.empty) {
              const childDocId = childrenSnap.docs[0].id;
              setUserWithFamilyData(u, familyId, childDocId, uid);
              return; // succès, pas besoin d'appeler la Cloud Function
            }
          } catch {
            // on continue vers le fallback Cloud Function
          }
          // Fallback : Cloud Function (collectionGroup, plus lent mais plus large)
          return recoverChildFamilyInfo(u, uid);
        }

        // ─── Routage selon les données utilisateur ───

        if (userData?.role === 'child') {
          // Si le store a déjà un user complet (posé par signInChild), ne rien
          // faire — les fallbacks asynchrones risquent d'écraser avec un user
          // sans familyId/childDocId et de casser la souscription au solde.
          const storeUser = useAuthStore.getState().user;
          if (
            storeUser &&
            storeUser.id === firebaseUser.uid &&
            storeUser.familyId &&
            storeUser.childDocId
          ) {
            return;
          }

          // Branche C : enfant
          const familyId =
            userData?.familyId || storeUser?.familyId || null;
          const childDocId =
            userData?.childDocId || storeUser?.childDocId || null;

          if (familyId && childDocId) {
            // IDs complets → prêt à l'emploi
            setUserWithFamilyData(userData, familyId, childDocId, firebaseUser.uid);
          } else if (familyId) {
            // On a familyId mais pas childDocId → chercher côté client
            clientRecoverChildDocId(userData, firebaseUser.uid, familyId).catch(
              () => {}
            );
          } else {
            // Aucun ID → Cloud Function (collectionGroup)
            recoverChildFamilyInfo(userData, firebaseUser.uid).catch(() => {});
          }
        } else if (userData?.familyId) {
          // Branche A : parent (ou autre) avec familyId
          store.setUser(userData);
          store.fetchFamily(userData.familyId);

          if (userData?.role === 'parent') {
            migrateLegacyParentData(firebaseUser.uid, userData.familyId).catch(
              (e) => console.error('[useAuth] Erreur migration legacy :', e)
            );
          }
        } else if (userData?.role === 'parent') {
          // Branche B : parent sans familyId (rétrocompatibilité)
          const familiesSnap = await getDocs(
            query(
              collection(db, 'families'),
              where('parentIds', 'array-contains', firebaseUser.uid)
            )
          ).catch(() => ({ empty: true, docs: [] } as any));

          if (!familiesSnap.empty) {
            const foundFamilyId = familiesSnap.docs[0].id;
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              familyId: foundFamilyId,
            }).catch(() => {});
            userData = { ...userData, familyId: foundFamilyId };
            store.setUser(userData);
            store.fetchFamily(foundFamilyId);

            migrateLegacyParentData(firebaseUser.uid, foundFamilyId).catch((e) =>
              console.error('[useAuth] Erreur migration legacy :', e)
            );
          } else {
            const { createFamily, updateUserFamilyId } = await import(
              '@/lib/firestore'
            );
            const family = await createFamily(
              userData.displayName || 'Ma Famille',
              firebaseUser.uid
            );
            await updateUserFamilyId(firebaseUser.uid, family.id).catch(() => {});
            userData = { ...userData, familyId: family.id };
            store.setUser(userData);
            store.fetchFamily(family.id);

            migrateLegacyParentData(firebaseUser.uid, family.id).catch((e) =>
              console.error('[useAuth] Erreur migration legacy :', e)
            );
          }
        } else {
          // Branche D : fallback
          store.setUser(userData);
        }
      } else {
        store.setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  return store;
}