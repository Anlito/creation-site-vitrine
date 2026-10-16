// Données fixes de l'outil : palettes, polices, symboles, blocs, pages proposées, contrôles, grille.
import listeSymboles from './symboles.json';

export interface Palette {
  id: string;
  nom: string;
  fond: string;
  surface: string;
  texte: string;
  texte2: string;
  principale: string;
  accent: string;
  ligne: string;
}

const pal = (nom: string, ...c: string[]): Palette => ({
  id: nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
  nom,
  fond: c[0], surface: c[1], texte: c[2], texte2: c[3], principale: c[4], accent: c[5], ligne: c[6],
});

export const PALETTES: Palette[] = [
  pal('Forêt', '#FFFFFF', '#F4F1EA', '#1F1E1B', '#55524B', '#2E5E4E', '#B4622A', '#DDD8CC'),
  pal('Bonbon', '#FFF6EA', '#FFFFFF', '#2A1840', '#5A4A6B', '#C7361F', '#1F6FD1', '#F0DCC4'),
  pal('Arcade', '#111114', '#1E1E25', '#F4F4F6', '#B8B8C4', '#FFD23F', '#FF6FAE', '#33333D'),
  pal('Terre', '#F3EFE6', '#FFFFFF', '#2B2620', '#5E564B', '#9C4328', '#5E7442', '#E2DACB'),
  pal('Océan', '#F2F7FA', '#FFFFFF', '#10222E', '#44586A', '#0E5A8A', '#C4601F', '#D3E1EA'),
  pal('Lavande', '#F7F4FB', '#FFFFFF', '#221A30', '#57506A', '#5B3E96', '#B23A6E', '#E3DCEF'),
  pal('Menthe', '#F1FAF6', '#FFFFFF', '#13261F', '#46594F', '#16735A', '#C24E33', '#D2E8DD'),
  pal('Minuit', '#0F1A2B', '#17253A', '#EEF3FA', '#B5C2D4', '#7FD1FF', '#FFC857', '#2A3A52'),
  pal('Corail', '#FFF3EF', '#FFFFFF', '#2B1A1A', '#634B4B', '#B73E3E', '#2F7A78', '#F1D9D1'),
  pal('Graphite', '#F5F5F5', '#FFFFFF', '#111111', '#4B4B4B', '#222222', '#D24A22', '#DCDCDC'),
];

export const palette = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];

/** Pastilles proposées sous la couleur de la palette (la couleur de la palette vient toujours en premier). */
export const PASTILLES_PRINCIPALE = ['#2E5E4E', '#0E5A8A', '#5B3E96', '#C7361F', '#9C4328', '#16735A', '#222222', '#F2C230', '#7FD1FF'];
export const PASTILLES_ACCENT = ['#B4622A', '#1F6FD1', '#FF6FAE', '#5E7442', '#C4601F', '#B23A6E', '#2F7A78', '#D24A22', '#FFC857'];

export interface PolicesPaire {
  id: string;
  nom: string;
  titre: string; // famille CSS
  texte: string;
  graisse: string;
  casse: 'none' | 'uppercase';
  espacement: string;
}

export const POLICES: PolicesPaire[] = [
  { id: 'elegante', nom: 'Élégante', titre: "'Instrument Serif', serif", texte: "'Instrument Sans', sans-serif", graisse: '400', casse: 'none', espacement: '0' },
  { id: 'ronde', nom: 'Ronde', titre: "'Baloo 2', sans-serif", texte: "'Nunito', sans-serif", graisse: '800', casse: 'none', espacement: '0' },
  { id: 'techno', nom: 'Techno', titre: "'Chakra Petch', sans-serif", texte: "'Archivo', sans-serif", graisse: '700', casse: 'uppercase', espacement: '.02em' },
  { id: 'naturelle', nom: 'Naturelle', titre: "'Bricolage Grotesque', sans-serif", texte: "'Literata', serif", graisse: '700', casse: 'none', espacement: '0' },
  { id: 'lisible', nom: 'Très lisible', titre: "'Lexend', sans-serif", texte: "'Lexend', sans-serif", graisse: '700', casse: 'none', espacement: '0' },
  { id: 'classique', nom: 'Classique', titre: "'Bree Serif', serif", texte: "'Source Sans 3', sans-serif", graisse: '400', casse: 'none', espacement: '0' },
  { id: 'manuscrite', nom: 'Manuscrite', titre: "'Pacifico', cursive", texte: "'Quicksand', sans-serif", graisse: '400', casse: 'none', espacement: '0' },
  { id: 'machine', nom: 'Machine à écrire', titre: "'Space Mono', monospace", texte: "'Work Sans', sans-serif", graisse: '700', casse: 'none', espacement: '0' },
];

export const polices = (id: string) => POLICES.find((p) => p.id === id) ?? POLICES[0];

export const FORMES_BOUTONS = [
  { id: 'carres', label: 'Carrés', rayon: '0px', carte: '0px' },
  { id: 'arrondis', label: 'Arrondis', rayon: '8px', carte: '10px' },
  { id: 'ronds', label: 'Ronds', rayon: '999px', carte: '18px' },
] as const;

export const COINS_IMAGES = [
  { id: 'droits', label: 'Droits', rayon: '0px' },
  { id: 'arrondis', label: 'Arrondis', rayon: '10px' },
  { id: 'tres-arrondis', label: 'Très arrondis', rayon: '22px' },
] as const;

/** Symboles du logo, rangés par catégorie (liste dans symboles.json). */
export const CATEGORIES_SYMBOLES: { nom: string; symboles: [string, string][] }[] = listeSymboles.categories as { nom: string; symboles: [string, string][] }[];

export const SYMBOLES: string[] = [...new Set(CATEGORIES_SYMBOLES.flatMap((c) => c.symboles.map(([n]) => n)))];

/** Noms lus par le lecteur d'écran (et utilisés pour la recherche). */
export const NOMS_SYMBOLES: Record<string, string> = Object.fromEntries(CATEGORIES_SYMBOLES.flatMap((c) => c.symboles));

export const MISES_EN_PAGE_LOGO = [
  { id: 'dessus', label: 'Au-dessus' },
  { id: 'gauche', label: 'À gauche' },
  { id: 'texte', label: 'Texte seul' },
  { id: 'rond', label: 'Rond' },
  { id: 'carre', label: 'Carré' },
] as const;

export type TypeBloc =
  | 'banniere' | 'titre' | 'paragraphe' | 'liste' | 'citation'
  | 'image' | 'galerie'
  | 'cartes' | 'produits' | 'horaires' | 'formulaire'
  | 'bouton' | 'separateur' | 'colonnes';

export type FamilleBloc = 'Mise en page' | 'Texte' | 'Images' | 'Présenter' | 'Navigation';

export const TYPES_BLOCS: { type: TypeBloc; label: string; desc: string; icon: string; famille: FamilleBloc }[] = [
  { type: 'colonnes', label: 'Colonnes', desc: '2 ou 3 blocs côte à côte', icon: 'view_column', famille: 'Mise en page' },
  { type: 'banniere', label: "Bandeau d'accueil", desc: 'Grande image et slogan', icon: 'panorama', famille: 'Texte' },
  { type: 'titre', label: 'Titre', desc: "Le nom d'une partie", icon: 'title', famille: 'Texte' },
  { type: 'paragraphe', label: 'Paragraphe', desc: 'Quelques lignes de texte', icon: 'notes', famille: 'Texte' },
  { type: 'liste', label: 'Liste', desc: 'Des points à la suite', icon: 'format_list_bulleted', famille: 'Texte' },
  { type: 'citation', label: 'Citation', desc: "Une phrase mise en valeur et son auteur", icon: 'format_quote', famille: 'Texte' },
  { type: 'image', label: 'Image avec légende', desc: 'Une photo et sa phrase', icon: 'image', famille: 'Images' },
  { type: 'galerie', label: "Galerie d'images", desc: '2 à 4 images côte à côte', icon: 'photo_library', famille: 'Images' },
  { type: 'cartes', label: 'Cartes', desc: 'Des cases avec une icône ou une image, un titre et un texte', icon: 'grid_view', famille: 'Présenter' },
  { type: 'produits', label: 'Fiches produits', desc: 'Image, nom, description et prix', icon: 'shopping_bag', famille: 'Présenter' },
  { type: 'horaires', label: 'Adresse et horaires', desc: "L'adresse du magasin et ses heures d'ouverture", icon: 'schedule', famille: 'Présenter' },
  { type: 'formulaire', label: 'Formulaire de contact', desc: "Un formulaire d'exemple (rien n'est envoyé)", icon: 'mail', famille: 'Présenter' },
  { type: 'bouton', label: 'Bouton vers une page', desc: 'Mène à une autre page', icon: 'smart_button', famille: 'Navigation' },
  { type: 'separateur', label: 'Séparateur', desc: 'Une ligne ou un espace entre deux parties', icon: 'horizontal_rule', famille: 'Mise en page' },
];

export const FAMILLES_BLOCS: FamilleBloc[] = ['Mise en page', 'Texte', 'Images', 'Présenter', 'Navigation'];

/** Blocs que l'on peut mettre dans une colonne (le bandeau, le séparateur et les colonnes prennent toute la largeur). */
export const TYPES_EN_COLONNE: TypeBloc[] = ['titre', 'paragraphe', 'liste', 'citation', 'image', 'galerie', 'cartes', 'produits', 'horaires', 'formulaire', 'bouton'];

/** Blocs dont on peut changer la couleur du texte. */
/** Blocs que l'on peut aligner à gauche, au centre ou à droite. */
export const TYPES_ALIGNABLES: TypeBloc[] = ['titre', 'paragraphe', 'liste', 'citation', 'bouton', 'image'];

export const TYPES_AVEC_COULEUR: TypeBloc[] = ['titre', 'paragraphe', 'liste', 'citation', 'cartes', 'horaires'];

/** Icônes proposées dans les cartes : les symboles du logo et quelques pictogrammes utiles. */
export const ICONES_CARTES: Record<string, string> = {
  storefront: 'Boutique', shopping_bag: 'Sac de courses', pin_drop: 'Lieu', schedule: 'Horloge', mail: 'Lettre', call: 'Téléphone',
  groups: 'Groupe', person: 'Personne', event: 'Calendrier', inventory_2: 'Carton', agriculture: 'Tracteur', payments: 'Billets',
  eco: 'Feuille', local_florist: 'Fleur', potted_plant: 'Plante en pot', park: 'Arbre', recycling: 'Recyclage', sports_esports: 'Manette',
  toys: 'Jouet', palette: 'Palette de peinture', brush: 'Pinceau', music_note: 'Note de musique', menu_book: 'Livre', local_cafe: 'Tasse',
  cake: 'Gâteau', restaurant: 'Couverts', redeem: 'Cadeau', checkroom: 'Cintre', favorite: 'Cœur', star: 'Étoile', bolt: 'Éclair',
  rocket_launch: 'Fusée', pets: 'Patte', photo_camera: 'Appareil photo', sunny: 'Soleil',
};

export const typeBloc = (t: TypeBloc) => TYPES_BLOCS.find((b) => b.type === t)!;

export const PAGES_PROPOSEES = [
  { id: 'accueil', nom: 'Accueil', desc: 'La première page que l’on voit', active: true },
  { id: 'concept', nom: 'Le concept', desc: 'Votre idée et le travail 3D', active: true },
  { id: 'produits', nom: 'Nos produits', desc: 'Le catalogue', active: true },
  { id: 'contact', nom: 'Contact', desc: 'Adresse, horaires, plan', active: true },
  { id: 'equipe', nom: "L'équipe", desc: 'Qui a fait quoi', active: false },
  { id: 'evenements', nom: 'Nos événements', desc: 'Ateliers, soldes, fêtes', active: false },
];

export const GRILLE = [
  { t: 'Charte graphique cohérente (couleurs, polices)', p: 3 },
  { t: 'Logo présent et lisible', p: 2 },
  { t: 'Au moins 3 pages, accueil complète', p: 2 },
  { t: 'Menu clair, liens entre les pages', p: 2 },
  { t: 'Textes rédigés et relus', p: 3 },
  { t: 'Travail 3D présenté (captures, plan, maquette)', p: 3 },
  { t: 'Catalogue de produits complet', p: 3 },
  { t: 'Images décrites (textes alternatifs)', p: 2 },
];

export const SLOGAN_PAR_DEFAUT = 'Ton slogan ici';
export const LIMITE_IMAGE = 1024 * 1024; // 1 Mo

/**
 * Dossier où l'équipe range son projet sur le réseau du collège (affiché comme conseil) : le même dossier
 * d'équipe que la modélisation Concept Store 3D, pour que l'outil professeur associe le site et la 3D.
 * « 4e B » devient « 4B » ; sans classe renseignée, on affiche « 4X ».
 */
export const dossierConseille = (classe?: string) => {
  const c = classe?.trim() ? classe.replace(/\s+/g, '').replace(/^(\d)e/i, '$1').toUpperCase() : '4X';
  return `${c} › COMMUN › TECHNOLOGIE › CONCEPT STORE › Prénom_Prénom (ton équipe)`;
};
