// Copie de secours du projet dans le navigateur (IndexedDB), quand l'enregistrement automatique
// dans le fichier n'est pas possible (Firefox, dossier pas encore choisi, droit refusé).
// Une seule copie : celle du dernier projet modifié sur ce poste. Elle est effacée dès que le
// projet est enregistré dans son fichier.
import type { Projet } from '../model';

export interface Secours { projet: Projet; date: string }

const BASE = 'vitrine';
const MAGASIN = 'secours';
const CLE = 'dernier';

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(MAGASIN);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

async function operation<T>(mode: IDBTransactionMode, f: (m: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await ouvrir();
    return await new Promise<T>((ok, ko) => {
      const r = f(db.transaction(MAGASIN, mode).objectStore(MAGASIN));
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  } catch {
    return undefined; // navigation privée ou stockage bloqué : pas de copie de secours
  }
}

export const ecrireSecours = (projet: Projet) => operation('readwrite', (m) => m.put({ projet, date: new Date().toISOString() } satisfies Secours, CLE));
export const lireSecours = () => operation<Secours>('readonly', (m) => m.get(CLE));
export const effacerSecours = () => operation('readwrite', (m) => m.delete(CLE));
