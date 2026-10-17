// Enregistrement et ouverture du fichier .vitrine (JSON, images en data URL). Aucun serveur.
// Sur Chrome et Edge, le premier enregistrement fait choisir le dossier CONCEPT STORE de la classe : l'outil y
// crée toujours lui-même le dossier de l'équipe (Lea_Malik, comme Concept Store 3D), puis le fichier ; les
// enregistrements suivants mettent à jour le même fichier. « Enregistrer ailleurs » garde « Enregistrer sous ».
// Ailleurs (Firefox), le fichier part dans Téléchargements.
// Quand le fichier est connu, le projet y est aussi enregistré automatiquement (voir enregistrerAuto).
import { estProjet, normaliserProjet, type Projet } from '../model';
import { cheminProjet, dossierEquipe, DOSSIER_PROJET } from './college';

// API d'accès aux fichiers (Chrome, Edge) : types minimaux, absents de la bibliothèque DOM standard.
interface Poignee {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (d: Blob) => Promise<void>; close: () => Promise<void> }>;
  queryPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
}
interface PoigneeDossier {
  name: string;
  getDirectoryHandle: (nom: string, o?: { create?: boolean }) => Promise<PoigneeDossier>;
  getFileHandle: (nom: string, o?: { create?: boolean }) => Promise<Poignee>;
}
type OptionsFichier = { id?: string; startIn?: string; suggestedName?: string; types?: { description: string; accept: Record<string, string[]> }[] };
declare global {
  interface Window {
    showSaveFilePicker?: (o?: OptionsFichier) => Promise<Poignee>;
    showOpenFilePicker?: (o?: OptionsFichier & { multiple?: boolean }) => Promise<Poignee[]>;
    showDirectoryPicker?: (o?: { id?: string; mode?: 'readwrite'; startIn?: string }) => Promise<PoigneeDossier>;
  }
}

const TYPE_VITRINE = [{ description: 'Projet Vitrine', accept: { 'application/json': ['.vitrine'] } }];

/** Le navigateur permet-il de choisir le dossier d'enregistrement ? */
export const peutChoisirDossier = () => typeof window.showSaveFilePicker === 'function';

/** Fichier du projet en cours (ouvert ou déjà enregistré pendant cette séance). */
let poigneeProjet: Poignee | null = null;
export const oublierFichierProjet = () => { poigneeProjet = null; };
export const fichierProjetConnu = () => poigneeProjet?.name ?? null;

const estAnnulation = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

export function telecharger(nom: string, contenu: Blob) {
  const url = URL.createObjectURL(contenu);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type ResultatEnregistrement =
  | { mode: 'dossier'; fichier: string; premiereFois: boolean }
  | { mode: 'telechargement'; fichier: string }
  | { mode: 'refuse'; raison: string } // dossier refusé, ou projet déjà présent (jamais écrasé)
  | null; // l'élève a fermé la fenêtre sans enregistrer

const simple = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
/** Dossier choisi : « projet » (CONCEPT STORE), « equipe » (le dossier de l'équipe lui-même) ou « autre ». */
export function sorteDeDossier(nom: string, equipe: string): 'projet' | 'equipe' | 'autre' {
  if (simple(nom) === simple(equipe)) return 'equipe';
  if (simple(nom) === simple(DOSSIER_PROJET)) return 'projet';
  return 'autre';
}

/**
 * Enregistre le projet. `ailleurs` force la fenêtre « Enregistrer sous » même si le fichier est déjà connu.
 */
const contenuFichier = (p: Projet) =>
  new Blob([JSON.stringify({ ...p, meta: { ...p.meta, enregistre_le: new Date().toISOString() } })], { type: 'application/json' });

async function ecrire(h: Poignee, contenu: Blob) {
  const w = await h.createWritable();
  await w.write(contenu);
  await w.close();
}

export async function enregistrerProjet(p: Projet, nom: string, ailleurs = false): Promise<ResultatEnregistrement> {
  const contenu = contenuFichier(p);
  if (peutChoisirDossier()) {
    let premiereFois = false;
    try {
      const equipe = dossierEquipe(p.meta.equipe ?? '');
      if (!poigneeProjet && !ailleurs && equipe && typeof window.showDirectoryPicker === 'function') {
        // Le dossier de l'équipe est toujours créé par l'outil : l'élève choisit le dossier CONCEPT STORE.
        const dir = await window.showDirectoryPicker({ id: 'vitrine-projet', mode: 'readwrite' });
        const sorte = sorteDeDossier(dir.name, equipe);
        if (sorte === 'equipe')
          return { mode: 'refuse', raison: `Tu as choisi « ${dir.name} », le dossier de ton équipe : l’outil le crée lui-même. Clique sur « Enregistrer » et choisis le dossier qui le contient, « ${DOSSIER_PROJET} ».` };
        if (sorte === 'autre' && !window.confirm(`Le dossier choisi s’appelle « ${dir.name} ».\nLe dossier attendu est « ${DOSSIER_PROJET} » (${cheminProjet(p.meta.classe ?? '')}).\n\nOK : créer le dossier « ${equipe} » dedans.\nAnnuler : ne rien enregistrer maintenant.`))
          return { mode: 'refuse', raison: `Rien n’a été enregistré. Clique sur « Enregistrer » et choisis le dossier « ${DOSSIER_PROJET} » de ta classe : l’outil y crée le dossier de ton équipe.` };
        const dossier = await dir.getDirectoryHandle(equipe, { create: true });
        const existant = await dossier.getFileHandle(nom).catch(() => null);
        if (existant && (await existant.getFile()).size)
          return { mode: 'refuse', raison: `Le dossier « ${equipe} » contient déjà « ${nom} » : il n’a pas été touché. Pour continuer ce projet, ouvre-le avec « Ouvrir mon projet ».` };
        poigneeProjet = await dossier.getFileHandle(nom, { create: true });
        premiereFois = true;
      } else if (!poigneeProjet || ailleurs) {
        poigneeProjet = await window.showSaveFilePicker!({ id: 'vitrine-projet', startIn: 'documents', suggestedName: nom, types: TYPE_VITRINE });
        premiereFois = true;
      }
      // Fichier ouvert avec « Ouvrir mon projet » : le navigateur demande l'autorisation d'y écrire (une fois).
      if (!premiereFois && poigneeProjet.requestPermission) await poigneeProjet.requestPermission({ mode: 'readwrite' });
      await ecrire(poigneeProjet, contenu);
      return { mode: 'dossier', fichier: poigneeProjet.name, premiereFois };
    } catch (e) {
      if (estAnnulation(e)) return null;
      // Droit refusé ou dossier introuvable : on retombe sur le téléchargement.
      poigneeProjet = null;
    }
  }
  telecharger(nom, contenu);
  return { mode: 'telechargement', fichier: nom };
}

export type ResultatAuto = 'ok' | 'aucun-fichier' | 'autorisation' | 'erreur';

/**
 * Enregistrement automatique, sans fenêtre : seulement si le fichier du projet est connu et que
 * le navigateur a déjà donné le droit d'y écrire pendant cette séance.
 */
export async function enregistrerAuto(p: Projet): Promise<ResultatAuto> {
  const h = poigneeProjet;
  if (!h) return 'aucun-fichier';
  try {
    if (h.queryPermission && (await h.queryPermission({ mode: 'readwrite' })) !== 'granted') return 'autorisation';
    await ecrire(h, contenuFichier(p));
    return 'ok';
  } catch {
    return 'erreur';
  }
}

/** Ouvre la boîte « Choisir un fichier ». Renvoie null si l'élève annule. */
export function choisirFichier(accept: string): Promise<File | null> {
  return new Promise((ok) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);
    let fini = false;
    input.addEventListener('change', () => { fini = true; ok(input.files?.[0] ?? null); input.remove(); });
    input.addEventListener('cancel', () => { if (!fini) ok(null); input.remove(); });
    input.click();
  });
}

/**
 * Choisit un fichier .vitrine. Avec Chrome et Edge, le navigateur rouvre le dernier dossier utilisé,
 * et `garder` permet ensuite d'enregistrer directement dans ce fichier.
 */
export async function choisirFichierProjet(garder: boolean, id = 'vitrine-projet'): Promise<File | null> {
  if (typeof window.showOpenFilePicker === 'function') {
    try {
      const [h] = await window.showOpenFilePicker({ id, startIn: 'documents', types: TYPE_VITRINE });
      const f = await h.getFile();
      if (garder) poigneeProjet = /\.vitrine$/i.test(f.name) ? h : null;
      return f;
    } catch (e) {
      if (estAnnulation(e)) return null;
    }
  }
  if (garder) poigneeProjet = null;
  return choisirFichier('.vitrine');
}

export type Lecture = { ok: true; projet: Projet } | { ok: false; nom: string };

export async function lireProjet(f: File): Promise<Lecture> {
  if (!/\.vitrine$/i.test(f.name)) return { ok: false, nom: f.name };
  try {
    const x = JSON.parse(await f.text());
    return estProjet(x) ? { ok: true, projet: normaliserProjet(x) } : { ok: false, nom: f.name };
  } catch {
    return { ok: false, nom: f.name };
  }
}
