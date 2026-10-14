// Modèles de page (contenu de départ à compléter) et structures de site toutes prêtes.
import {
  img, nouveauBloc, nouvelleDeclinaison, type BlocColonnes, nouvelleCarte, nouveauProduit, uid, type Bloc, type BlocBanniere, type BlocBouton, type BlocCartes,
  type BlocCitation, type BlocGalerie, type BlocImage, type BlocListe, type BlocParagraphe,
  type BlocProduits, type BlocTitre, type Projet,
} from '../model';

/** Pages existantes du projet, pour que les boutons et cartes mènent quelque part. */
interface Ctx { p: Projet; existe: (id: string) => string | null }

// Petites fabriques de blocs, avec des textes qui expliquent quoi écrire.
const titre = (texte: string, grand = false): BlocTitre => ({ ...(nouveauBloc('titre') as BlocTitre), texte, grand });
const para = (texte: string): BlocParagraphe => ({ ...(nouveauBloc('paragraphe') as BlocParagraphe), texte });
const image = (nom: string, legende = ''): BlocImage => ({ ...(nouveauBloc('image') as BlocImage), image: img(nom), legende });
const liste = (elements: string[]): BlocListe => ({ ...(nouveauBloc('liste') as BlocListe), elements });
/** Bloc Colonnes : un argument par colonne (un bloc, ou plusieurs blocs empilés). */
const colonnes = (...cols: (Bloc | Bloc[])[]): BlocColonnes => ({
  ...(nouveauBloc('colonnes') as BlocColonnes), n: cols.length === 3 ? 3 : 2,
  colonnes: [...cols.map((c) => (Array.isArray(c) ? c : [c])), [], []].slice(0, 3),
});
const bouton = (texte: string, cible: string | null): BlocBouton => ({ ...(nouveauBloc('bouton') as BlocBouton), texte, cible });
const citation = (texte: string, auteur: string): BlocCitation => ({ ...(nouveauBloc('citation') as BlocCitation), texte, auteur });
const galerie = (noms: string[]): BlocGalerie => ({ ...(nouveauBloc('galerie') as BlocGalerie), images: [...noms, 'Image 4', 'Image 4'].slice(0, 4).map((n) => img(n)), n: Math.min(4, Math.max(2, noms.length)) as 2 | 3 | 4 });
const cartesIcones = (items: [string, string, string, string | null][]): BlocCartes => ({
  ...(nouveauBloc('cartes') as BlocCartes), style: 'icone',
  cartes: items.map(([icone, t, texte, cible], i) => ({ ...nouvelleCarte(i + 1, icone), titre: t, texte, cible })),
});
const cartesImages = (items: [string, string, string][]): BlocCartes => ({
  ...(nouveauBloc('cartes') as BlocCartes), style: 'image',
  cartes: items.map(([nomImage, t, texte], i) => ({ ...nouvelleCarte(i + 1), image: img(nomImage), titre: t, texte })),
});
const produits = (n: number): BlocProduits => ({ ...(nouveauBloc('produits') as BlocProduits), produits: Array.from({ length: n }, (_, i) => nouveauProduit(i + 1)) });
/** Comme produits(n), mais le premier produit est proposé en 3 couleurs (exemple de déclinaisons). */
const produitsAvecDeclinaisons = (n: number): BlocProduits => {
  const b = produits(n);
  b.produits[0] = {
    ...b.produits[0], nom: 'Produit en 3 couleurs', desc: 'Clique sur une pastille pour voir chaque couleur.',
    declinaisons: [['Rouge', '#C7361F'], ['Bleu', '#1F6FD1'], ['Vert', '#2E8B57']].map(([nom, couleur], i) => ({ ...nouvelleDeclinaison(i + 1, img(`Photo · ${nom.toLowerCase()}`)), nom, couleur })),
  };
  return b;
};

export interface Modele {
  id: string;
  nom: string;
  desc: string;
  /** Pages pour lesquelles ce modèle est conseillé ; absent = convient à toutes les pages. */
  pages?: string[];
  blocs: (c: Ctx) => Bloc[];
}

export const MODELES: Modele[] = [
  // ——— Accueil ———
  {
    id: 'accueil-classique', nom: 'Accueil classique', pages: ['accueil'],
    desc: 'Bandeau avec slogan, présentation, puis trois cartes vers les autres pages.',
    blocs: (c) => [
      { ...(nouveauBloc('banniere', c.existe('produits')) as BlocBanniere), bouton: 'Voir nos produits' },
      titre(`Bienvenue chez ${c.p.nom}`),
      para('Présente ton concept store en 3 à 5 phrases : ce que l’on y trouve, pour qui, et ce qui le rend unique.'),
      cartesIcones([
        ['storefront', 'Le concept', 'Notre idée, le plan et le magasin en 3D.', c.existe('concept')],
        ['shopping_bag', 'Nos produits', 'Découvre tout notre catalogue.', c.existe('produits')],
        ['pin_drop', 'Contact', 'Adresse, horaires et plan d’accès.', c.existe('contact')],
      ]),
    ],
  },
  {
    id: 'accueil-produits', nom: 'Accueil avec produits phares', pages: ['accueil'],
    desc: 'Bandeau, trois produits mis en avant, une citation et un bouton vers le catalogue.',
    blocs: (c) => [
      { ...(nouveauBloc('banniere', c.existe('produits')) as BlocBanniere), bouton: 'Voir le catalogue' },
      titre('Nos produits phares'),
      produits(3),
      citation('Écris ici une phrase qui résume l’esprit de ton magasin.', 'L’équipe'),
      bouton('Voir tous nos produits', c.existe('produits')),
    ],
  },
  {
    id: 'accueil-texte-image', nom: 'Accueil texte et image', pages: ['accueil'],
    desc: 'Sans bandeau : un texte à côté d’une image, puis trois points forts. Pense à ajouter ton slogan.',
    blocs: (c) => [
      titre(c.p.nom, true),
      colonnes(para('Présente ton magasin en quelques phrases. Dis ce que l’on y trouve et pourquoi venir.'), image('Photo de la boutique')),
      titre('Pourquoi venir chez nous ?'),
      cartesIcones([
        ['star', 'Point fort 1', 'Explique-le en une phrase.', null],
        ['favorite', 'Point fort 2', 'Explique-le en une phrase.', null],
        ['bolt', 'Point fort 3', 'Explique-le en une phrase.', null],
      ]),
      bouton('Découvrir notre concept', c.existe('concept')),
    ],
  },

  // ——— Le concept ———
  {
    id: 'concept-3d', nom: 'Concept et travail 3D', pages: ['concept'],
    desc: 'Texte et capture 3D côte à côte, points forts, puis « Du plan à la maquette ».',
    blocs: () => [
      titre('Notre concept', true),
      colonnes(
        para('Explique ton idée : comment fonctionne ton magasin ? Qu’est-ce qui le rend différent des autres ?'),
        image('Capture de la modélisation 3D', 'Vue d’ensemble du magasin, modélisé en 3D par l’équipe.'),
      ),
      titre('Ce qui nous rend uniques'),
      cartesIcones([
        ['inventory_2', 'Idée 1', 'Décris-la en une phrase.', null],
        ['agriculture', 'Idée 2', 'Décris-la en une phrase.', null],
        ['payments', 'Idée 3', 'Décris-la en une phrase.', null],
      ]),
      titre('Du plan à la maquette'),
      cartesImages([
        ['Plan 2D', 'Le plan 2D', 'Les rayons, la caisse et les passages.'],
        ['Vue 3D de dessus', 'La modélisation 3D', 'Le magasin en volume, vu de dessus.'],
        ['Maquette en carton', 'La maquette en carton', 'Construite à l’échelle 1/50.'],
      ]),
    ],
  },
  {
    id: 'concept-simple', nom: 'Concept en quelques mots', pages: ['concept'],
    desc: 'Titre, texte, liste des idées clés et une galerie d’images.',
    blocs: () => [
      titre('Notre concept', true),
      para('Raconte en quelques phrases comment est née l’idée de ton magasin.'),
      titre('Nos idées clés'),
      liste(['Première idée', 'Deuxième idée', 'Troisième idée']),
      galerie(['Plan 2D', 'Capture 3D', 'Maquette en carton']),
    ],
  },

  // ——— Nos produits ———
  {
    id: 'produits-catalogue', nom: 'Catalogue', pages: ['produits'],
    desc: 'Grand titre, une phrase d’introduction et six fiches produits.',
    blocs: () => [
      titre('Nos produits', true),
      para('Présente ta sélection en une ou deux phrases.'),
      produitsAvecDeclinaisons(6),
    ],
  },
  {
    id: 'produits-rayons', nom: 'Catalogue par rayons', pages: ['produits'],
    desc: 'Les produits rangés en deux rayons, chacun avec son titre.',
    blocs: () => [
      titre('Nos produits', true),
      para('Nos produits sont rangés par rayon, comme dans le magasin.'),
      titre('Rayon 1'),
      produits(3),
      titre('Rayon 2'),
      produits(3),
    ],
  },

  // ——— Contact ———
  {
    id: 'contact-complet', nom: 'Contact complet', pages: ['contact'],
    desc: 'Adresse et horaires à côté du formulaire, puis le plan d’accès.',
    blocs: () => [
      titre('Nous trouver', true),
      colonnes(nouveauBloc('horaires'), nouveauBloc('formulaire')),
      image('Plan d’accès', 'Indique comment venir : bus, tram, métro…'),
    ],
  },
  {
    id: 'contact-simple', nom: 'Contact simple', pages: ['contact'],
    desc: 'Adresse et horaires à côté du plan d’accès.',
    blocs: () => [
      titre('Nous trouver', true),
      colonnes(nouveauBloc('horaires'), image('Plan d’accès')),
    ],
  },

  // ——— L'équipe ———
  {
    id: 'equipe-portraits', nom: 'Portraits de l’équipe', pages: ['equipe'],
    desc: 'Une carte par élève avec son rôle dans le projet.',
    blocs: (c) => [
      titre('L’équipe', true),
      para('Nous sommes quatre élèves de 4e. Voici qui a fait quoi dans le projet.'),
      cartesIcones(['Webmaster', 'Designer 3D', 'Chef de projet', 'Responsable maquette'].map((role, i) => (
        ['person', `Prénom ${i + 1}`, role, null] as [string, string, string, string | null]
      ))),
      citation('Ce que nous avons appris pendant ce projet…', c.p.nom),
    ],
  },

  // ——— Nos événements ———
  {
    id: 'evenements-agenda', nom: 'Agenda des événements', pages: ['evenements'],
    desc: 'Trois événements avec image, date et description, puis un bouton vers le contact.',
    blocs: (c) => [
      titre('Nos événements', true),
      para('Ateliers, fêtes, soldes : voici ce qui se passe bientôt dans notre magasin.'),
      cartesImages([
        ['Photo de l’atelier', 'Samedi 12 · Atelier', 'Décris l’événement en une phrase.'],
        ['Photo de la fête', 'Mercredi 23 · Fête', 'Décris l’événement en une phrase.'],
        ['Photo des soldes', 'Du 1er au 15 · Soldes', 'Décris l’événement en une phrase.'],
      ]),
      bouton('Nous contacter', c.existe('contact')),
    ],
  },

  // ——— Pour toutes les pages ———
  {
    id: 'general-texte', nom: 'Titre et texte', desc: 'Un grand titre et un paragraphe, pour commencer simplement.',
    blocs: () => [titre('Titre de la page', true), para('Écris ton texte ici. Astuce : 3 à 5 phrases suffisent.')],
  },
  {
    id: 'general-colonnes', nom: 'Deux colonnes', desc: 'Un texte à gauche, une image à droite, puis une liste et une image côte à côte.',
    blocs: () => [
      titre('Titre de la page', true),
      colonnes(para('Texte de la colonne de gauche.'), image('Image de droite')),
      colonnes(liste(['Premier point', 'Deuxième point', 'Troisième point']), image('Autre image')),
    ],
  },
  {
    id: 'general-trois', nom: 'Trois colonnes', desc: 'Un titre puis trois parties côte à côte, chacune avec un sous-titre et un texte.',
    blocs: () => [
      titre('Titre de la page', true),
      cartesIcones([
        ['star', 'Partie 1', 'Quelques phrases.', null],
        ['favorite', 'Partie 2', 'Quelques phrases.', null],
        ['bolt', 'Partie 3', 'Quelques phrases.', null],
      ]),
      para('Un texte pour conclure.'),
    ],
  },
];

/** Modèles proposés pour une page : d'abord ceux de la page, puis les modèles généraux. */
export function modelesPour(pageId: string): { conseilles: Modele[]; generaux: Modele[] } {
  return {
    conseilles: MODELES.filter((m) => m.pages?.includes(pageId)),
    generaux: MODELES.filter((m) => !m.pages),
  };
}

/** Fabrique les blocs d'un modèle pour un projet (identifiants neufs à chaque fois). */
export function blocsDuModele(m: Modele, p: Projet): Bloc[] {
  const existe = (id: string) => (p.pages.some((pg) => pg.id === id && pg.active) ? id : null);
  return m.blocs({ p, existe }).map((b) => ({ ...b, id: uid() }));
}
