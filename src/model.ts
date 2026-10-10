// Modèle du projet (contenu du fichier .vitrine) et fonctions utilitaires.
import {
  COINS_IMAGES, FORMES_BOUTONS, PAGES_PROPOSEES, SLOGAN_PAR_DEFAUT, palette, polices, type Palette, type PolicesPaire, type TypeBloc,
} from './data/constantes';

export interface Img {
  src: string | null; // image en data URL, ou null tant qu'aucune image n'est choisie
  alt: string;
  nom: string; // nom du fichier, ou texte affiché dans la zone provisoire
}

export type Fond = 'aucun' | 'douce' | 'principale';

/** `couleur` : couleur du texte choisie par l'élève (sinon celle de la charte). */
interface BlocBase { id: string; fond: Fond; couleur?: string }
export interface BlocBanniere extends BlocBase { type: 'banniere'; image: Img; slogan: string; sous: string; bouton: string; cible: string | null }
export interface BlocTitre extends BlocBase { type: 'titre'; texte: string; grand: boolean }
export interface BlocParagraphe extends BlocBase { type: 'paragraphe'; texte: string }
export interface BlocImage extends BlocBase { type: 'image'; image: Img; legende: string }
export interface BlocListe extends BlocBase { type: 'liste'; elements: string[] }
export interface BlocBouton extends BlocBase { type: 'bouton'; texte: string; cible: string | null }
export interface BlocGalerie extends BlocBase { type: 'galerie'; images: Img[]; n: 2 | 3 | 4 }
export interface Produit { id: string; nom: string; desc: string; prix: string; image: Img }
export interface BlocProduits extends BlocBase { type: 'produits'; produits: Produit[] }

export interface Carte { id: string; icone: string; image: Img; titre: string; texte: string; cible: string | null }
export interface BlocCartes extends BlocBase { type: 'cartes'; style: 'icone' | 'image'; cartes: Carte[] }
export interface Horaire { jour: string; heures: string }
export interface BlocHoraires extends BlocBase { type: 'horaires'; adresse: string; acces: string; horaires: Horaire[] }
export interface BlocFormulaire extends BlocBase { type: 'formulaire'; titre: string; bouton: string }
export interface BlocCitation extends BlocBase { type: 'citation'; texte: string; auteur: string }
export interface BlocSeparateur extends BlocBase { type: 'separateur'; style: 'ligne' | 'espace' }
/** 2 ou 3 colonnes ; chaque colonne est une pile de blocs. On garde 3 colonnes pour ne rien perdre en passant de 3 à 2. */
export interface BlocColonnes extends BlocBase { type: 'colonnes'; n: 2 | 3; repartition: 'egal' | 'gauche' | 'droite'; colonnes: Bloc[][] }

export type Bloc =
  | BlocBanniere | BlocTitre | BlocParagraphe | BlocImage | BlocListe | BlocBouton | BlocGalerie | BlocProduits
  | BlocCartes | BlocHoraires | BlocFormulaire | BlocCitation | BlocSeparateur | BlocColonnes;

export interface Page {
  id: string;
  nom: string;
  /** Page parente : la page est alors une sous-page, rangée dans un sous-menu (un seul niveau). */
  parent?: string;
  desc?: string;
  active: boolean;
  verrouillee?: boolean;
  perso?: boolean;
  blocs: Bloc[];
}

/** Police importée par l'élève (fichier téléchargé sur Google Fonts, par exemple). */
export interface PoliceImportee {
  id: string;
  famille: string; // nom utilisé dans le site, par exemple « Poppins »
  fichier: string; // nom du fichier d'origine
  format: 'woff2' | 'woff' | 'truetype' | 'opentype';
  donnees: string; // data URL
}

export interface Charte {
  /** Identifiant d'une palette, ou « perso » : l'élève choisit lui-même la couleur du fond. */
  palette: string;
  principale: string;
  accent: string;
  /** Identifiant d'une paire de polices, ou « perso » : voir policesPerso. */
  polices: string;
  perso?: { fond: string };
  policesImportees?: PoliceImportee[];
  /** Familles choisies pour les titres et le texte quand polices = « perso ». */
  policesPerso?: { titre: string; texte: string };
  boutons: (typeof FORMES_BOUTONS)[number]['id'];
  images: (typeof COINS_IMAGES)[number]['id'];
}

export interface Logo {
  texte: string;
  symbole: string | null;
  mise_en_page: 'dessus' | 'gauche' | 'texte' | 'rond' | 'carre';
  /** « perso » : couleurs du symbole et du texte choisies par l'élève. */
  couleurs: 'charte' | 'un-ton' | 'perso';
  image_importee?: string;
  // Personnalisation (absent = valeur par défaut tirée de la charte)
  sousTitre?: string;
  police?: string;
  graisse?: 'normal' | 'gras';
  majuscules?: boolean;
  espacement?: number; // en em, de 0 à 0,3
  tailleTexte?: number; // 1 = normal, de 0,7 à 1,5
  tailleSymbole?: number;
  forme?: 'rond' | 'arrondi' | 'carre' | 'aucune'; // forme derrière le symbole
  couleurSymbole?: string;
  couleurTexte?: string;
}

export interface Projet {
  app: 'vitrine';
  version: 1;
  nom: string;
  charte: Charte;
  logo: Logo;
  pages: Page[];
  meta: { classe?: string; equipe?: string; enregistre_le?: string };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const img = (nom: string, alt = ''): Img => ({ src: null, alt, nom });

export const nouveauProduit = (i: number): Produit => ({ id: uid(), nom: `Produit ${i}`, desc: 'Une phrase pour décrire le produit.', prix: '10 €', image: img(`Photo du produit ${i}`) });

export const nouvelleCarte = (i: number, icone = 'star'): Carte => ({ id: uid(), icone, image: img(`Image ${i}`), titre: `Titre ${i}`, texte: 'Une ou deux phrases.', cible: null });

export function nouveauBloc(type: TypeBloc, cible: string | null = null): Bloc {
  const base = { id: uid(), fond: 'aucun' as Fond };
  switch (type) {
    case 'banniere': return { ...base, type, image: img('Photo de la boutique'), slogan: SLOGAN_PAR_DEFAUT, sous: 'Une phrase pour donner envie.', bouton: 'Découvrir', cible };
    case 'titre': return { ...base, type, texte: 'Nouveau titre', grand: false };
    case 'paragraphe': return { ...base, type, texte: 'Écris ton texte ici.' };
    case 'image': return { ...base, type, image: img('Nouvelle image'), legende: '' };
    case 'liste': return { ...base, type, elements: ['Premier point', 'Deuxième point'] };
    case 'bouton': return { ...base, type, texte: 'Voir la page', cible };
    case 'galerie': return { ...base, type, images: [1, 2, 3, 4].map((i) => img(`Image ${i}`)), n: 3 };
    case 'produits': return { ...base, type, produits: [1, 2, 3].map((i) => nouveauProduit(i)) };
    case 'cartes': return { ...base, type, style: 'icone', cartes: [nouvelleCarte(1, 'star'), nouvelleCarte(2, 'favorite'), nouvelleCarte(3, 'bolt')] };
    case 'horaires': return {
      ...base, type, adresse: '12 rue des Lilas\n69003 Lyon', acces: '',
      horaires: [{ jour: 'Mardi au vendredi', heures: '9 h – 19 h' }, { jour: 'Samedi', heures: '9 h – 18 h' }, { jour: 'Dimanche et lundi', heures: 'Fermé' }],
    };
    case 'formulaire': return { ...base, type, titre: 'Nous écrire', bouton: 'Envoyer' };
    case 'citation': return { ...base, type, texte: 'Une phrase qui donne envie de venir.', auteur: '' };
    case 'separateur': return { ...base, type, style: 'ligne' };
    case 'colonnes': return { ...base, type, n: 2, repartition: 'egal', colonnes: [[], [], []] };
  }
}

export function nouveauProjet(nom: string): Projet {
  const pages: Page[] = PAGES_PROPOSEES.map((p) => ({
    id: p.id, nom: p.nom, desc: p.desc, active: p.active, verrouillee: p.id === 'accueil' || undefined, blocs: [],
  }));
  pages[0].blocs = [nouveauBloc('banniere', 'produits')];
  const p = palette('foret');
  return {
    app: 'vitrine',
    version: 1,
    nom,
    charte: { palette: p.id, principale: p.principale, accent: p.accent, polices: 'elegante', boutons: 'arrondis', images: 'arrondis' },
    logo: { texte: nom, symbole: null, mise_en_page: 'gauche', couleurs: 'charte' },
    pages,
    meta: {},
  };
}

/** Copie d'un bloc avec de nouveaux identifiants (y compris les blocs de ses colonnes). */
export function dupliquer(b: Bloc): Bloc {
  const c = { ...structuredClone(b), id: uid() } as Bloc;
  if (c.type === 'colonnes') c.colonnes = c.colonnes.map((col) => col.map(dupliquer));
  return c;
}

/** Colonnes affichées (celles au-delà de n sont gardées mais masquées). */
export const colonnesVisibles = (b: BlocColonnes) => b.colonnes.slice(0, b.n);

/** Tous les blocs visibles d'une page, y compris ceux rangés dans des colonnes. */
export function blocsVisibles(blocs: Bloc[]): Bloc[] {
  return blocs.flatMap((b) => (b.type === 'colonnes' ? [b, ...colonnesVisibles(b).flat()] : [b]));
}

export interface BlocTrouve { bloc: Bloc; parent: BlocColonnes | null; colonne: number; index: number }

/** Trouve un bloc par son identifiant, même dans une colonne. */
export function trouverBloc(blocs: Bloc[], id: string | null): BlocTrouve | null {
  if (!id) return null;
  for (let i = 0; i < blocs.length; i++) {
    const b = blocs[i];
    if (b.id === id) return { bloc: b, parent: null, colonne: -1, index: i };
    if (b.type === 'colonnes') {
      for (let k = 0; k < b.colonnes.length; k++) {
        const j = b.colonnes[k].findIndex((x) => x.id === id);
        if (j >= 0) return { bloc: b.colonnes[k][j], parent: b, colonne: k, index: j };
      }
    }
  }
  return null;
}

/** Modifie un bloc (même dans une colonne). `f` renvoie null pour le retirer. */
export function majBloc(blocs: Bloc[], id: string, f: (b: Bloc) => Bloc | null): Bloc[] {
  return blocs.flatMap((b) => {
    if (b.id === id) { const n = f(b); return n ? [n] : []; }
    if (b.type === 'colonnes' && b.colonnes.some((col) => col.some((x) => x.id === id))) {
      return [{ ...b, colonnes: b.colonnes.map((col) => col.flatMap((x) => { if (x.id !== id) return [x]; const n = f(x); return n ? [n] : []; })) }];
    }
    return [b];
  });
}

// ——— Pages et sous-pages ———

/** Une page est visible si elle est cochée, et si sa page parente l'est aussi. */
export function pageVisible(p: Projet, pg: Page) {
  if (!pg.active) return false;
  if (!pg.parent) return true;
  const parent = p.pages.find((x) => x.id === pg.parent);
  return !!parent && parent.active;
}

/** Sous-pages d'une page, dans l'ordre. */
export const sousPages = (p: Projet, id: string) => p.pages.filter((x) => x.parent === id);

/** Pages dans l'ordre du menu : chaque page du menu principal, suivie de ses sous-pages. */
export function arbrePages(p: Projet, seulementVisibles = true): { page: Page; niveau: 0 | 1 }[] {
  const r: { page: Page; niveau: 0 | 1 }[] = [];
  const garder = (pg: Page) => !seulementVisibles || pageVisible(p, pg);
  for (const pg of p.pages) {
    if (pg.parent && p.pages.some((x) => x.id === pg.parent)) continue;
    if (!garder(pg)) { if (seulementVisibles) continue; }
    r.push({ page: pg, niveau: 0 });
    for (const sp of sousPages(p, pg.id)) if (garder(sp)) r.push({ page: sp, niveau: 1 });
  }
  return r;
}

/** Pages du site, dans l'ordre du menu. */
export const pagesActives = (p: Projet) => arbrePages(p).map((x) => x.page);

/** Menu du site : pages principales et leurs sous-pages visibles. */
export function menuSite(p: Projet): { page: Page; enfants: Page[] }[] {
  return p.pages
    .filter((pg) => (!pg.parent || !p.pages.some((x) => x.id === pg.parent)) && pageVisible(p, pg))
    .map((pg) => ({ page: pg, enfants: sousPages(p, pg.id).filter((sp) => pageVisible(p, sp)) }));
}

/** Nom affiché dans les listes : les sous-pages sont décalées. */
export const nomDansListe = (p: Projet, pg: Page) => (pg.parent && p.pages.some((x) => x.id === pg.parent) ? `\u00A0\u00A0\u00A0↳ ${pg.nom}` : pg.nom);


/** Nom de fichier sans accents ni espaces : « Bocal & Cie » → « bocal-et-cie ». */
export function slug(s: string, secours = 'mon-site') {
  const r = s
    .toLowerCase()
    .replace(/&/g, ' et ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return r || secours;
}

/** Nom du fichier HTML de chaque page exportée (Accueil = index.html). */
export function fichiersPages(p: Projet): Record<string, string> {
  const r: Record<string, string> = {};
  const pris = new Set<string>();
  for (const pg of pagesActives(p)) {
    let f = pg.id === 'accueil' ? 'index' : slug(pg.nom, 'page');
    if (f === 'index' && pg.id !== 'accueil') f = 'page-index';
    let k = f; let i = 2;
    while (pris.has(k)) k = `${f}-${i++}`;
    pris.add(k);
    r[pg.id] = `${k}.html`;
  }
  return r;
}

// ——— Couleurs ———

const rvb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const hexa = (c: number[]) => '#' + c.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('').toUpperCase();

export function luminance(hex: string) {
  return rvb(hex)
    .map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); })
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
}

export function contraste(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Texte posé sur une couleur : blanc ou presque noir, selon le meilleur contraste. */
export const surCouleur = (c: string) => (contraste(c, '#FFFFFF') >= contraste(c, '#111111') ? '#FFFFFF' : '#111111');

/**
 * « Foncer la couleur pour moi » : assombrit par pas de 10 % jusqu'à 4,5:1.
 * Sur un fond foncé, on éclaircit au lieu d'assombrir.
 */
export function corrigerContraste(c: string, fond: string) {
  const clair = luminance(fond) > 0.4;
  let x = rvb(c);
  for (let i = 0; i < 40 && contraste(hexa(x), fond) < 4.5; i++) {
    x = clair ? x.map((v) => v * 0.9) : x.map((v) => v + (255 - v) * 0.1);
  }
  return hexa(x);
}

/** Variante plus claire d'une couleur (logo sur fond foncé). */
export function eclaircir(c: string, k = 0.45) {
  return hexa(rvb(c).map((v) => v + (255 - v) * k));
}

/** Mélange deux couleurs : k = 0 donne a, k = 1 donne b. */
export const melanger = (a: string, b: string, k: number) => {
  const x = rvb(a), y = rvb(b);
  return hexa(x.map((v, i) => v + (y[i] - v) * k));
};

/**
 * Palette réellement utilisée. Avec « Ma palette », l'élève choisit le fond, la couleur principale et l'accent ;
 * les autres teintes (texte, surface, lignes) sont calculées pour rester lisibles.
 */
export function paletteDe(c: Charte): Palette {
  if (c.palette !== 'perso' || !c.perso) return palette(c.palette);
  const fond = c.perso.fond.toUpperCase();
  const clair = luminance(fond) > 0.3;
  const texte = clair ? '#1B1B1F' : '#F4F4F6';
  let texte2 = melanger(texte, fond, 0.3);
  if (contraste(texte2, fond) < 4.5) texte2 = texte;
  return {
    id: 'perso', nom: 'Ma palette', fond, texte, texte2,
    surface: clair ? melanger(fond, '#000000', 0.04) : melanger(fond, '#FFFFFF', 0.07),
    ligne: melanger(fond, texte, 0.16),
    principale: c.principale, accent: c.accent,
  };
}

/** Polices réellement utilisées : une paire proposée, ou le choix « perso » (polices importées comprises). */
export function policesDe(c: Charte): PolicesPaire {
  if (c.polices !== 'perso' || !c.policesPerso) return polices(c.polices);
  const importee = (f: string) => !!c.policesImportees?.some((x) => x.famille === f);
  const css = (f: string) => `'${f}', sans-serif`;
  return {
    id: 'perso', nom: 'Mes polices',
    titre: css(c.policesPerso.titre), texte: css(c.policesPerso.texte),
    graisse: importee(c.policesPerso.titre) ? '400' : '700', casse: 'none', espacement: '0',
  };
}

export const contrasteOk = (p: Projet) => contraste(p.charte.principale, paletteDe(p.charte).fond) >= 3;

/** Variables CSS appliquées à la racine de chaque page du site. */
export function variablesSite(p: Projet): Record<string, string> {
  const pal = paletteDe(p.charte);
  const pol = policesDe(p.charte);
  const btn = FORMES_BOUTONS.find((f) => f.id === p.charte.boutons) ?? FORMES_BOUTONS[1];
  const im = COINS_IMAGES.find((f) => f.id === p.charte.images) ?? COINS_IMAGES[1];
  return {
    '--bg': pal.fond,
    '--surf': pal.surface,
    '--ink': pal.texte,
    '--muted': pal.texte2,
    '--pri': p.charte.principale,
    '--onpri': surCouleur(p.charte.principale),
    '--acc': p.charte.accent,
    '--onacc': surCouleur(p.charte.accent),
    '--line': pal.ligne,
    '--fh': pol.titre,
    '--fb': pol.texte,
    '--hw': pol.graisse,
    '--ht': pol.casse,
    '--ls': pol.espacement,
    '--r': btn.carte,
    '--rb': btn.rayon,
    '--img': im.rayon,
    '--lr': p.logo.mise_en_page === 'carre' ? '22%' : '50%',
  };
}

/** Variables d'un bloc posé sur la couleur principale : le texte passe en blanc ou noir automatiquement. */
export function variablesFondPrincipal(p: Projet): Record<string, string> {
  const pri = p.charte.principale;
  const on = surCouleur(pri);
  return { '--ink': on, '--muted': on, '--pri': on, '--onpri': pri };
}

export const estImageLourde = (i: Img) => !!i.src && Math.round((i.src.length - i.src.indexOf(',') - 1) * 0.75) > 1024 * 1024;

/** Toutes les images d'un bloc qui comptent (les images masquées d'une galerie sont ignorées). */
export function imagesDuBloc(b: Bloc): Img[] {
  if (b.type === 'banniere' || b.type === 'image') return [b.image];
  if (b.type === 'galerie') return b.images.slice(0, b.n);
  if (b.type === 'produits') return b.produits.map((x) => x.image);
  if (b.type === 'cartes' && b.style === 'image') return b.cartes.map((x) => x.image);
  if (b.type === 'colonnes') return colonnesVisibles(b).flat().flatMap(imagesDuBloc);
  return [];
}

/** Vérifie qu'un objet lu dans un fichier ressemble bien à un projet Vitrine. */
export function estProjet(x: unknown): x is Projet {
  const p = x as Projet;
  return !!p && typeof p === 'object' && p.app === 'vitrine' && p.version === 1 && typeof p.nom === 'string'
    && Array.isArray(p.pages) && !!p.charte && !!p.logo;
}

/**
 * Met à jour un projet lu dans un fichier enregistré par une version précédente de Vitrine :
 * blocs « à côté du précédent » et colonnes à une seule case deviennent des colonnes en piles.
 */
export function normaliserProjet(p: Projet): Projet {
  type Ancien = Bloc & { aCote?: boolean };
  const colonnesEnPiles = (b: Bloc): Bloc => {
    if (b.type !== 'colonnes') return b;
    const cols = (b.colonnes as unknown[]).map((c) => (Array.isArray(c) ? c : c ? [c] : []) as Bloc[]);
    while (cols.length < 3) cols.push([]);
    return { ...b, colonnes: cols };
  };
  const pages = p.pages.map((pg) => {
    const blocs: Bloc[] = [];
    for (const brut of pg.blocs as Ancien[]) {
      const { aCote, ...reste } = brut;
      const b = colonnesEnPiles(reste as Bloc);
      const der = blocs[blocs.length - 1];
      if (aCote && der && b.type !== 'banniere' && b.type !== 'separateur') {
        if (der.type === 'colonnes' && der.n < 3 && (der as BlocColonnes & { auto?: boolean }).auto) {
          der.colonnes[der.n] = [b]; der.n = (der.n + 1) as 2 | 3; continue;
        }
        if (der.type !== 'banniere' && der.type !== 'separateur' && der.type !== 'colonnes') {
          const c = { ...(nouveauBloc('colonnes') as BlocColonnes), auto: true };
          c.colonnes = [[der], [b], []];
          blocs[blocs.length - 1] = c;
          continue;
        }
      }
      blocs.push(b);
    }
    for (const b of blocs) delete (b as { auto?: boolean }).auto;
    return { ...pg, blocs };
  });
  return { ...p, pages };
}
