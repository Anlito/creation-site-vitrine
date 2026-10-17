// État de l'application : projet en cours, historique d'annulation, écran et réglages d'interface.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { enregistrerAuto } from './lib/fichier';
import { ecrireSecours, effacerSecours } from './lib/secours';
import { slug, type Projet } from './model';

export type Etape = 1 | 2 | 3 | 4 | 5;
export type Ecran = 'accueil' | 'nommer' | 'projet' | 'enseignant';

export interface Message {
  /** « non-enregistre » : l'élève a fermé la fenêtre « Enregistrer sous » à la création du projet. */
  type: 'enregistre' | 'exporte' | 'non-enregistre' | 'refuse';
  /** « refuse » : ce qui n'a pas été fait, et quoi faire. */
  raison?: string;
  /** Enregistré dans un dossier choisi (sinon dans Téléchargements). */
  dossier?: boolean;
  premiereFois?: boolean;
  fichier: string;
}

export interface Ui {
  pageId: string;
  sel: string | null;
  appareil: 'ordinateur' | 'telephone';
  panneau: 'bloc' | 'charte' | 'modeles';
  /** Aperçu du site en plein écran. */
  apercu: boolean;
  /** Visite guidée en cours (partie de l'outil), panneau d'aide ouvert. */
  visite: Etape | null;
  aideOuverte: boolean;
  /** Parties pour lesquelles la visite a déjà été proposée pendant cette séance. */
  visitesProposees: number[];
  /** Projet créé pendant cette séance : on propose alors les visites guidées. */
  nouveauProjet: boolean;
  /** Colonne de réglages rabattue pour agrandir l'aperçu de la page (quand un bloc est choisi). */
  reglagesReduits: boolean;
  /** Colonne ouverte à la main alors qu'aucun bloc n'est choisi (sinon elle reste en bande). */
  reglagesOuvertsSansBloc: boolean;
  ongletCharte: 'couleurs' | 'logo';
  /** Message « image réduite » affiché à côté du bloc concerné. */
  reduction: { blocId: string; avant: number; apres: number } | null;
}

const UI_INITIALE: Ui = { pageId: 'accueil', sel: null, appareil: 'ordinateur', panneau: 'bloc', ongletCharte: 'couleurs', reduction: null, apercu: false, reglagesReduits: false, reglagesOuvertsSansBloc: false,
  visite: null, aideOuverte: false, visitesProposees: [], nouveauProjet: false,
};

/**
 * Enregistrement automatique : « ok » = enregistré dans le fichier du projet ; « secours » = pas de fichier,
 * copie gardée dans le navigateur ; « autorisation » = le navigateur attend un clic sur « Enregistrer ».
 */
export interface EtatSauvegarde { etat: 'aucune' | 'ok' | 'secours' | 'autorisation' | 'erreur'; heure?: string }

const heureLisible = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

interface App {
  ecran: Ecran;
  etape: Etape;
  projet: Projet | null;
  ui: Ui;
  message: Message | null;
  peutAnnuler: boolean;
  modifie: boolean;
  sauvegarde: EtatSauvegarde;
  allerA: (e: Ecran) => void;
  allerEtape: (e: Etape) => void;
  ouvrirProjet: (p: Projet) => void;
  /** Modifie le projet. `cle` regroupe les frappes successives dans le même champ en une seule annulation. */
  maj: (f: (p: Projet) => Projet, cle?: string) => void;
  annuler: () => void;
  setUi: (u: Partial<Ui> | ((u: Ui) => Partial<Ui>)) => void;
  setMessage: (m: Message | null) => void;
  marquerEnregistre: () => void;
  fermerProjet: () => void;
}

const Ctx = createContext<App | null>(null);

export const useApp = () => {
  const a = useContext(Ctx);
  if (!a) throw new Error('useApp hors du fournisseur');
  return a;
};

/** Le projet est sûr d'exister dans les écrans de construction. */
export const useProjet = () => {
  const a = useApp();
  return { ...a, projet: a.projet as Projet };
};

export const nomFichier = (p: Projet) => `${slug(p.nom, 'mon-projet')}.vitrine`;

export function FournisseurApp({ children }: { children: React.ReactNode }) {
  const [ecran, setEcran] = useState<Ecran>('accueil');
  const [etape, setEtape] = useState<Etape>(2);
  // Projet et historique ensemble : chaque modification empile l'état précédent.
  const [hist, setHist] = useState<{ projet: Projet | null; passe: Projet[] }>({ projet: null, passe: [] });
  const histRef = useRef(hist);
  histRef.current = hist;
  const projet = hist.projet;
  const [ui, setUiState] = useState<Ui>(UI_INITIALE);
  const [message, setMessage] = useState<Message | null>(null);
  const [modifie, setModifie] = useState(false);
  const dernier = useRef<{ cle: string; t: number } | null>(null);
  const [sauvegarde, setSauvegarde] = useState<EtatSauvegarde>({ etat: 'aucune' });

  // Enregistrement automatique, 2,5 s après la dernière modification : dans le fichier du projet
  // si c'est possible, sinon une copie de secours dans le navigateur.
  useEffect(() => {
    if (!projet || !modifie) return;
    const p = projet;
    const t = setTimeout(async () => {
      const r = await enregistrerAuto(p);
      if (r === 'ok') {
        effacerSecours();
        if (histRef.current.projet === p) setModifie(false); // rien n'a changé pendant l'écriture
        setSauvegarde({ etat: 'ok', heure: heureLisible() });
      } else {
        await ecrireSecours(p);
        setSauvegarde({ etat: r === 'autorisation' ? 'autorisation' : r === 'erreur' ? 'erreur' : 'secours', heure: heureLisible() });
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [projet, modifie]);

  // Prévenir la perte du travail si l'élève ferme l'onglet sans avoir enregistré.
  useEffect(() => {
    if (!modifie) return;
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [modifie]);

  const maj = useCallback((f: (p: Projet) => Projet, cle?: string) => {
    const maintenant = Date.now();
    const d = dernier.current;
    const regrouper = !!cle && !!d && d.cle === cle && maintenant - d.t < 1500;
    dernier.current = cle ? { cle, t: maintenant } : null;
    setHist((h) => {
      if (!h.projet) return h;
      const n = f(h.projet);
      if (n === h.projet) return h;
      return { projet: n, passe: regrouper ? h.passe : [...h.passe.slice(-99), h.projet] };
    });
    setModifie(true);
  }, []);

  const annuler = useCallback(() => {
    const h = histRef.current;
    if (!h.passe.length) return;
    const prec = h.passe[h.passe.length - 1];
    setHist({ projet: prec, passe: h.passe.slice(0, -1) });
    setUiState((u) => ({
      ...u,
      pageId: prec.pages.some((pg) => pg.id === u.pageId) ? u.pageId : 'accueil',
      sel: u.sel && prec.pages.some((pg) => pg.blocs.some((b) => b.id === u.sel)) ? u.sel : null,
    }));
    dernier.current = null;
    setModifie(true);
  }, []);

  const setUi = useCallback((u: Partial<Ui> | ((u: Ui) => Partial<Ui>)) => {
    setUiState((x) => ({ ...x, ...(typeof u === 'function' ? u(x) : u) }));
  }, []);

  const app = useMemo<App>(() => ({
    ecran, etape, projet, ui, message, modifie, sauvegarde,
    peutAnnuler: hist.passe.length > 0,
    allerA: (e) => { setEcran(e); setMessage(null); },
    allerEtape: (e) => {
      setEtape(e);
      setEcran('projet');
      setMessage((m) => (m?.type === 'enregistre' || m?.type === 'non-enregistre' || m?.type === 'refuse' ? m : null));
      window.scrollTo(0, 0);
    },
    ouvrirProjet: (p) => {
      setHist({ projet: p, passe: [] });
      dernier.current = null;
      setUiState({ ...UI_INITIALE, pageId: p.pages.find((pg) => pg.active)?.id ?? 'accueil' });
      setModifie(false);
      setMessage(null);
      setSauvegarde({ etat: 'aucune' });
    },
    maj, annuler, setUi, setMessage,
    marquerEnregistre: () => { setModifie(false); setSauvegarde({ etat: 'ok', heure: heureLisible() }); effacerSecours(); },
    fermerProjet: () => { setHist({ projet: null, passe: [] }); setModifie(false); setMessage(null); },
  }), [ecran, etape, projet, ui, message, modifie, sauvegarde, hist.passe.length, maj, annuler, setUi]);

  return <Ctx.Provider value={app}>{children}</Ctx.Provider>;
}
