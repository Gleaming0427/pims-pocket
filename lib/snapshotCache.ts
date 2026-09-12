/**
 * Cache de souscriptions Firestore partagé.
 *
 * Plusieurs écrans appellent les mêmes hooks avec les mêmes paramètres
 * (ex. useMissions() sans filtre, monté par le layout, le dashboard et les
 * validations). Sans cache, chaque montage crée un listener onSnapshot
 * identique : connexions, mémoire et bande passante gaspillées.
 *
 * Ce cache déduplique : la première souscription ouvre le listener, les
 * suivantes s'y accrochent, et le listener se ferme quand plus personne
 * n'écoute (comptage de références).
 */

interface CachedSnapshot {
  refs: number;
  unsub: () => void;
}

const snapshotCache = new Map<string, CachedSnapshot>();

export function subscribeCached(
  key: string,
  subscribe: () => () => void
): () => void {
  const existing = snapshotCache.get(key);
  if (existing) {
    existing.refs++;
    return () => {
      existing.refs--;
      if (existing.refs <= 0) {
        existing.unsub();
        snapshotCache.delete(key);
      }
    };
  }

  const unsub = subscribe();
  const entry: CachedSnapshot = { refs: 1, unsub };
  snapshotCache.set(key, entry);

  return () => {
    entry.refs--;
    if (entry.refs <= 0) {
      entry.unsub();
      snapshotCache.delete(key);
    }
  };
}
