/**
 * Migration des données legacy (pré-"famille") vers le nouveau modèle.
 *
 * Contexte : avant le commit d89bfd2, les enfants étaient stockés dans
 * users/{parentUid}/children/{childId}. Après, ils sont dans
 * families/{familyId}/children/{childId}. Cette migration est appelée
 * au login pour les comptes parent créés avant la migration.
 *
 * Idempotente : un flag _legacyMigrationV1 sur le document user
 * empêche de re-jouer la migration.
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MigrationResult {
  /** Nombre d'enfants migrés */
  migratedChildren: number;
  /** Nombre de transactions mises à jour */
  migratedTxs: number;
  /** Nombre de missions mises à jour */
  migratedMissions: number;
  /** Nombre d'objectifs d'épargne mis à jour */
  migratedGoals: number;
  /** Nombre de demandes d'argent mises à jour */
  migratedRequests: number;
}

// ---------------------------------------------------------------------------
// Migration principale
// ---------------------------------------------------------------------------

/**
 * Migre les données d'un parent legacy vers le nouveau modèle "famille".
 * Idempotente : ne fait rien si la migration a déjà été effectuée.
 *
 * @param parentUid - UID Firebase Auth du parent
 * @param familyId  - ID du document famille (déjà créé par useAuth.ts)
 */
export async function migrateLegacyParentData(
  parentUid: string,
  familyId: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    migratedChildren: 0,
    migratedTxs: 0,
    migratedMissions: 0,
    migratedGoals: 0,
    migratedRequests: 0,
  };

  try {
    // ── Idempotence : flags par étape ──
    const userRef = doc(db, 'users', parentUid);
    const parentDoc = await getDoc(userRef);
    const flags: Record<string, boolean> = parentDoc.exists()
      ? parentDoc.data()?._mig ?? {}
      : {};

    // Si tout est déjà fait, ne rien faire
    if (flags.children && flags.transactions && flags.missions && flags.goals && flags.requests) {
      console.log('[migration] Migration déjà effectuée, rien à faire.');
      return result;
    }

    console.log('[migration] Début de la migration legacy…', { flags });

    // ── 1. Migration des enfants ──
    // Mapping oldChildDocId → newChildDocId pour les étapes suivantes
    const childIdMapping = new Map<string, string>();
    if (!flags.children) {
      try {
        await migrateChildren(parentUid, familyId, childIdMapping, result);
        await updateDoc(userRef, { '_mig.children': true }).catch(() => {});
      } catch (e) {
        console.error('[migration] Erreur migration enfants :', e);
        return result; // Bloquant : sans enfants le reste ne sert à rien
      }
    } else {
      console.log('[migration] Étape enfants déjà faite, passage à la suite.');
    }

    // ── 2. Mise à jour des transactions ──
    if (!flags.transactions) {
      try {
        await migrateTransactions(parentUid, familyId, childIdMapping, result);
        await updateDoc(userRef, { '_mig.transactions': true }).catch(() => {});
      } catch (e) {
        console.error('[migration] Erreur migration transactions :', e);
      }
    } else {
      console.log('[migration] Étape transactions déjà faite, passage.');
    }

    // ── 3. Mise à jour des missions ──
    if (!flags.missions) {
      try {
        await migrateMissions(parentUid, familyId, childIdMapping, result);
        await updateDoc(userRef, { '_mig.missions': true }).catch(() => {});
      } catch (e) {
        console.error('[migration] Erreur migration missions :', e);
      }
    } else {
      console.log('[migration] Étape missions déjà faite, passage.');
    }

    // ── 4. Mise à jour des objectifs ──
    if (!flags.goals) {
      try {
        await migrateGoals(parentUid, familyId, childIdMapping, result);
        await updateDoc(userRef, { '_mig.goals': true }).catch(() => {});
      } catch (e) {
        console.error('[migration] Erreur migration goals :', e);
      }
    } else {
      console.log('[migration] Étape goals déjà faite, passage.');
    }

    // ── 5. Mise à jour des demandes d'argent ──
    if (!flags.requests) {
      try {
        await migrateMoneyRequests(parentUid, familyId, childIdMapping, result);
        await updateDoc(userRef, { '_mig.requests': true }).catch(() => {});
      } catch (e) {
        console.error('[migration] Erreur migration moneyRequests :', e);
      }
    } else {
      console.log('[migration] Étape moneyRequests déjà faite, passage.');
    }

    console.log('[migration] Migration terminée.', result);

    return result;
  } catch (e) {
    console.error('[migration] Erreur globale migration :', e);
    return result;
  }
}

// ---------------------------------------------------------------------------
// Étape 1 : Enfants
// ---------------------------------------------------------------------------

async function migrateChildren(
  parentUid: string,
  familyId: string,
  childIdMapping: Map<string, string>,
  result: MigrationResult
): Promise<void> {
  const legacyChildrenCol = collection(db, 'users', parentUid, 'children');
  const snap = await getDocs(legacyChildrenCol);

  if (snap.empty) {
    console.log('[migration] Aucun enfant legacy à migrer.');
    return;
  }

  const newChildrenCol = collection(db, 'families', familyId, 'children');
  const batchSize = 500;
  const allDocs = snap.docs;

  for (let i = 0; i < allDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = allDocs.slice(i, i + batchSize);

    for (const oldDoc of chunk) {
      const oldData = oldDoc.data();
      const newDocRef = doc(newChildrenCol, oldDoc.id); // Conserver l'ID existant
      const newData: DocumentData = {
        ...oldData,
        familyId,
      };

      batch.set(newDocRef, newData);
      batch.delete(oldDoc.ref);

      childIdMapping.set(oldDoc.id, oldDoc.id); // L'ID est conservé donc mapping identité

      result.migratedChildren++;
    }

    await batch.commit();
  }

  console.log(
    `[migration] ${result.migratedChildren} enfant(s) migré(s) vers families/${familyId}/children/.`
  );
}

// ---------------------------------------------------------------------------
// Étape 2 : Transactions
// ---------------------------------------------------------------------------

async function migrateTransactions(
  parentUid: string,
  familyId: string,
  childIdMapping: Map<string, string>,
  result: MigrationResult
): Promise<void> {
  // Récupérer les transactions sans familyId (legacy ou déjà partielles)
  const txSnap = await getDocs(
    query(
      collection(db, 'transactions'),
      where('parentId', '==', parentUid)
    )
  );

  // Filtrer celles qui n'ont pas déjà un familyId
  const legacyTxs = txSnap.docs.filter((d) => !d.data().familyId);

  if (legacyTxs.length === 0) {
    console.log('[migration] Aucune transaction legacy à migrer.');
    return;
  }

  const batchSize = 500;

  for (let i = 0; i < legacyTxs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = legacyTxs.slice(i, i + batchSize);

    for (const txDoc of chunk) {
      const txData = txDoc.data();
      const updatePayload: DocumentData = { familyId };

      // Si l'ancien childDocId est connu, le mapper
      if (txData.childDocId && childIdMapping.has(txData.childDocId)) {
        updatePayload.childDocId = childIdMapping.get(txData.childDocId);
      }

      batch.update(txDoc.ref, updatePayload);
      result.migratedTxs++;
    }

    await batch.commit();
  }

  console.log(
    `[migration] ${result.migratedTxs} transaction(s) mises à jour avec familyId.`
  );
}

// ---------------------------------------------------------------------------
// Étape 3 : Missions
// ---------------------------------------------------------------------------

async function migrateMissions(
  parentUid: string,
  familyId: string,
  childIdMapping: Map<string, string>,
  result: MigrationResult
): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'missions'), where('parentId', '==', parentUid))
  );

  const legacyDocs = snap.docs.filter((d) => !d.data().familyId);

  if (legacyDocs.length === 0) {
    console.log('[migration] Aucune mission legacy à migrer.');
    return;
  }

  const batchSize = 500;

  for (let i = 0; i < legacyDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = legacyDocs.slice(i, i + batchSize);

    for (const mDoc of chunk) {
      const mData = mDoc.data();
      const updatePayload: DocumentData = { familyId };

      if (mData.childDocId && childIdMapping.has(mData.childDocId)) {
        updatePayload.childDocId = childIdMapping.get(mData.childDocId);
      }

      batch.update(mDoc.ref, updatePayload);
      result.migratedMissions++;
    }

    await batch.commit();
  }

  console.log(
    `[migration] ${result.migratedMissions} mission(s) mises à jour avec familyId.`
  );
}

// ---------------------------------------------------------------------------
// Étape 4 : Objectifs d'épargne
// ---------------------------------------------------------------------------

async function migrateGoals(
  parentUid: string,
  familyId: string,
  childIdMapping: Map<string, string>,
  result: MigrationResult
): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'goals'), where('parentId', '==', parentUid))
  );

  const legacyDocs = snap.docs.filter((d) => !d.data().familyId);

  if (legacyDocs.length === 0) {
    console.log('[migration] Aucun objectif legacy à migrer.');
    return;
  }

  const batchSize = 500;

  for (let i = 0; i < legacyDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = legacyDocs.slice(i, i + batchSize);

    for (const gDoc of chunk) {
      const gData = gDoc.data();
      const updatePayload: DocumentData = { familyId };

      if (gData.childDocId && childIdMapping.has(gData.childDocId)) {
        updatePayload.childDocId = childIdMapping.get(gData.childDocId);
      }

      batch.update(gDoc.ref, updatePayload);
      result.migratedGoals++;
    }

    await batch.commit();
  }

  console.log(
    `[migration] ${result.migratedGoals} objectif(s) mis à jour avec familyId.`
  );
}

// ---------------------------------------------------------------------------
// Étape 5 : Demandes d'argent
// ---------------------------------------------------------------------------

async function migrateMoneyRequests(
  parentUid: string,
  familyId: string,
  childIdMapping: Map<string, string>,
  result: MigrationResult
): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'moneyRequests'), where('parentId', '==', parentUid))
  );

  const legacyDocs = snap.docs.filter((d) => !d.data().familyId);

  if (legacyDocs.length === 0) {
    console.log('[migration] Aucune demande d\'argent legacy à migrer.');
    return;
  }

  const batchSize = 500;

  for (let i = 0; i < legacyDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = legacyDocs.slice(i, i + batchSize);

    for (const rDoc of chunk) {
      const rData = rDoc.data();
      const updatePayload: DocumentData = { familyId };

      if (rData.childDocId && childIdMapping.has(rData.childDocId)) {
        updatePayload.childDocId = childIdMapping.get(rData.childDocId);
      }

      batch.update(rDoc.ref, updatePayload);
      result.migratedRequests++;
    }

    await batch.commit();
  }

  console.log(
    `[migration] ${result.migratedRequests} demande(s) d'argent mises à jour avec familyId.`
  );
}