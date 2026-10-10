// Les 8 vérifications automatiques (étape « Contrôle et export » et espace enseignant).
import { SLOGAN_PAR_DEFAUT } from '../data/constantes';
import { blocsVisibles, contrasteOk, estImageLourde, imagesDuBloc, pagesActives, type Bloc, type Projet } from '../model';

/** Blocs « simples » d'une page (le contenu des colonnes compris, sans les colonnes elles-mêmes). */
const simples = (blocs: Bloc[]) => blocsVisibles(blocs).filter((b) => b.type !== 'colonnes');
import type { Etape } from '../etat';

export interface Cible { etape: Etape; pageId?: string; blocId?: string; onglet?: 'couleurs' | 'logo' }

export interface Verif {
  id: string;
  t: string;
  court: string;
  ok: boolean;
  detail?: string;
  action?: string;
  cible?: Cible;
}

/** « Contact » avec espaces insécables. */
export const g = (s: string) => `« ${s} »`;

const listeNoms = (noms: string[]) =>
  noms.length === 1 ? g(noms[0]) : noms.slice(0, -1).map(g).join(', ') + ' et ' + g(noms[noms.length - 1]);

export function verifier(p: Projet): Verif[] {
  const pages = pagesActives(p);

  // 1. Chaque page a un titre (les pages vides sont signalées à part)
  const sansTitre = pages.filter((pg) => pg.blocs.length > 0 && !simples(pg.blocs).some((b) =>
    (b.type === 'titre' && b.texte.trim()) || (b.type === 'banniere' && b.slogan.trim())));
  const titres: Verif = {
    id: 'titres', t: 'Chaque page a un titre', court: 'Titres', ok: sansTitre.length === 0,
    detail: sansTitre.length === 1 ? `La page ${g(sansTitre[0].nom)} n’a pas de titre.` : `Les pages ${listeNoms(sansTitre.map((x) => x.nom))} n’ont pas de titre.`,
    action: 'Aller à la page', cible: sansTitre[0] && { etape: 4, pageId: sansTitre[0].id },
  };

  // 2. Chaque image a une description
  const manquantes: { pageId: string; nom: string; blocId: string }[] = [];
  for (const pg of pages) for (const b of simples(pg.blocs)) for (const im of imagesDuBloc(b)) {
    if (!im.alt.trim()) manquantes.push({ pageId: pg.id, nom: pg.nom, blocId: b.id });
  }
  const pagesAlt = [...new Set(manquantes.map((m) => m.nom))];
  const n = manquantes.length;
  const alt: Verif = {
    id: 'alt', t: 'Chaque image a une description', court: 'Textes alternatifs', ok: n === 0,
    detail: `${n === 1 ? '1 image sans description' : `${n} images sans description`} sur ${pagesAlt.length === 1 ? g(pagesAlt[0]) : listeNoms(pagesAlt)}.`,
    action: 'Corriger', cible: manquantes[0] && { etape: 4, pageId: manquantes[0].pageId, blocId: manquantes[0].blocId },
  };

  // 3. Aucune page vide
  const vides = pages.filter((pg) => pg.blocs.length === 0);
  const pagesVides: Verif = {
    id: 'vides', t: 'Aucune page vide', court: 'Pages vides', ok: vides.length === 0,
    detail: vides.length === 1 ? `La page ${g(vides[0].nom)} est vide.` : `Les pages ${listeNoms(vides.map((x) => x.nom))} sont vides.`,
    action: 'Ajouter du contenu', cible: vides[0] && { etape: 4, pageId: vides[0].id },
  };

  // 4. Au moins 3 pages, dont l'accueil
  const aAccueil = pages.some((pg) => pg.id === 'accueil');
  const nbPages: Verif = {
    id: 'pages', t: 'Au moins 3 pages, dont l’accueil', court: '3 pages minimum', ok: pages.length >= 3 && aAccueil,
    detail: !aAccueil ? 'La page « Accueil » manque.' : `Ton site n’a que ${pages.length} page${pages.length > 1 ? 's' : ''}.`,
    action: 'Choisir les pages', cible: { etape: 3 },
  };

  // 5. Un logo
  const L = p.logo;
  const logoOk = !!L.image_importee || (!!L.texte.trim() && (!!L.symbole || L.mise_en_page === 'texte'));
  const logo: Verif = {
    id: 'logo', t: 'Un logo', court: 'Logo', ok: logoOk,
    detail: 'Choisis un symbole, ou importe le logo de ton équipe.', action: 'Créer mon logo', cible: { etape: 2, onglet: 'logo' },
  };

  // 6. Des couleurs bien lisibles
  const couleurs: Verif = {
    id: 'contraste', t: 'Des couleurs bien lisibles', court: 'Contrastes', ok: contrasteOk(p),
    detail: 'Ta couleur principale se lit mal sur ton fond.', action: 'Corriger', cible: { etape: 2, onglet: 'couleurs' },
  };

  // 7. Un slogan sur l'accueil
  const accueil = p.pages.find((pg) => pg.id === 'accueil');
  const bandeau = accueil?.blocs.find((b) => b.type === 'banniere');
  const sloganOk = !!bandeau && bandeau.type === 'banniere' && !!bandeau.slogan.trim() && bandeau.slogan.trim() !== SLOGAN_PAR_DEFAUT;
  const slogan: Verif = {
    id: 'slogan', t: 'Un slogan sur l’accueil', court: 'Slogan', ok: sloganOk,
    detail: bandeau ? 'Écris le slogan de ton bandeau d’accueil.' : 'Ajoute un bandeau d’accueil sur la page « Accueil ».',
    action: 'Corriger', cible: { etape: 4, pageId: 'accueil', blocId: bandeau?.id },
  };

  // 8. Des images bien légères
  const lourdes: { pageId: string; blocId: string }[] = [];
  for (const pg of pages) for (const b of simples(pg.blocs)) for (const im of imagesDuBloc(b)) {
    if (estImageLourde(im)) lourdes.push({ pageId: pg.id, blocId: b.id });
  }
  const legeres: Verif = {
    id: 'poids', t: 'Des images bien légères', court: 'Poids des images', ok: lourdes.length === 0,
    detail: `${lourdes.length === 1 ? '1 image pèse' : `${lourdes.length} images pèsent`} plus de 1 Mo. Choisis-la à nouveau : elle sera réduite.`,
    action: 'Corriger', cible: lourdes[0] && { etape: 4, ...lourdes[0] },
  };

  // 0. Nom, classe et prénoms du groupe
  const infosOk = !!p.nom.trim() && !!p.meta.classe?.trim() && !!p.meta.equipe?.trim();
  const infos: Verif = {
    id: 'infos', t: 'Le nom du site, la classe et les prénoms du groupe', court: 'Infos du groupe', ok: infosOk,
    detail: 'Complète les informations de ton projet.', action: 'Compléter', cible: { etape: 1 },
  };

  return [infos, titres, alt, pagesVides, nbPages, logo, couleurs, slogan, legeres];
}
