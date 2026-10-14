// Contenu de l'aide : visites guidées (une par partie de l'outil) et questions fréquentes.
import type { Etape } from '../etat';

export interface EtapeVisite {
  /** Élément à mettre en lumière (sélecteur CSS) ; absent = bulle au centre de l'écran. */
  cible?: string;
  titre: string;
  texte: string;
}

export const NOMS_PARTIES: Record<Etape, string> = {
  1: 'Mon projet', 2: 'Charte graphique', 3: 'Pages', 4: 'Contenu', 5: 'Vérifier et exporter',
};

export const VISITES: Record<Etape, EtapeVisite[]> = {
  1: [
    { titre: 'Bienvenue dans Vitrine !', texte: 'Tu vas créer le site de ton concept store. Cette visite te montre l’essentiel en une minute.' },
    { cible: '.o-champ-geant', titre: 'Le nom de ton site', texte: 'C’est le nom de ton concept store. Il apparaît dans ton logo et en haut de chaque page.' },
    { cible: '.o-nommer-equipe', titre: 'Ta classe et ton groupe', texte: 'Ces informations sont obligatoires : elles permettent à ton professeur de retrouver ton travail.' },
    { cible: '[data-aide="onglets"]', titre: 'Les parties de l’outil', texte: 'Charte graphique, Pages, Contenu… Il n’y a pas d’ordre : passe d’une partie à l’autre quand tu veux.' },
    { cible: '[data-aide="apercu"]', titre: 'Voir ton site', texte: 'L’aperçu montre ton site en plein écran, comme le verront les visiteurs, sur ordinateur ou sur téléphone.' },
    { cible: '[data-aide="enregistrer"]', titre: 'Ton projet s’enregistre tout seul', texte: 'Ton projet est dans le dossier de ton équipe et s’enregistre automatiquement : le bouton affiche « Enregistré ». S’il affiche « Enregistrer » avec un point orange, clique dessus.' },
    { cible: '[data-aide="aide"]', titre: 'Besoin d’aide ?', texte: 'Ce bouton ouvre les réponses aux questions fréquentes, et relance la visite de la partie où tu es.' },
  ],
  2: [
    { cible: '.o-onglets', titre: 'Deux onglets', texte: '« Couleurs et polices » pour l’allure de ton site, « Mon logo » pour créer ton logo.' },
    { cible: '.o-grille-palettes', titre: 'Choisis une palette', texte: 'Une palette, c’est un ensemble de couleurs qui vont bien ensemble. Clique sur celle qui ressemble à ton magasin.' },
    { cible: '[data-aide="ma-palette"]', titre: 'Ou crée ta palette', texte: 'Avec « Ma palette », tu choisis toi-même la couleur du fond, la couleur principale et l’accent.' },
    { cible: '[data-aide="couleurs"]', titre: 'Ajuste tes couleurs', texte: 'Change la couleur principale (boutons, liens, menu) et l’accent. Si un message orange apparaît, ta couleur se lit mal : fonce-la.' },
    { cible: '[data-aide="polices"]', titre: 'Tes polices', texte: 'Choisis une police pour les titres et une pour le texte. Tu peux même importer une police gratuite de Google Fonts.' },
    { cible: '.o-apercu-charte', titre: 'L’aperçu en direct', texte: 'Chaque changement apparaît tout de suite ici, et s’applique à toutes les pages de ton site.' },
    { cible: '#onglet-logo', titre: 'Ton logo', texte: 'Dans « Mon logo », choisis un symbole, une mise en page et des couleurs. Tu pourras ensuite télécharger ton logo pour l’oral ou la maquette.' },
  ],
  3: [
    { cible: '.o-liste-pages', titre: 'Les pages de ton site', texte: 'Coche les pages que tu veux. Il en faut au moins 3, dont l’accueil, qui est toujours présente.' },
    { cible: '.o-ligne-page-actions', titre: 'L’ordre du menu', texte: 'Les flèches montent ou descendent une page : c’est l’ordre dans lequel elles apparaîtront dans le menu.' },
    { cible: '.o-select-place', titre: 'Les sous-pages', texte: 'Range une page « sous » une autre : elle apparaîtra dans un sous-menu, par exemple « Le concept › Plan 2D ».' },
    { cible: '.o-ajout-page', titre: 'Ajoute tes pages', texte: 'Écris le nom d’une nouvelle page, choisis si c’est une page du menu ou une sous-page, puis clique sur « Ajouter ».' },
    { cible: '.o-apercu-menu', titre: 'L’aperçu du menu', texte: 'Tu vois ici ton menu sur ordinateur et sur téléphone.' },
  ],
  4: [
    { cible: '.o-choix-page', titre: 'Choisis la page à remplir', texte: 'Cette liste te permet de passer d’une page à l’autre. Les pages encore vides sont marquées « (vide) ».' },
    { cible: '[data-aide="modeles"]', titre: 'Pars d’un modèle', texte: 'Un modèle remplit ta page avec une mise en page toute prête : il ne te reste qu’à changer les textes et les images.' },
    { cible: '.o-panneau-blocs', titre: 'Ajoute des blocs', texte: 'Un bloc, c’est un morceau de page : un titre, un texte, une image… Glisse-le sur la page, ou clique dessus pour l’ajouter en bas.' },
    { cible: '[data-aide="colonnes"]', titre: 'Des blocs côte à côte', texte: 'Le bloc « Colonnes » crée 2 ou 3 colonnes. Mets autant de blocs que tu veux dans chaque colonne.' },
    { cible: '.o-zone-apercu', titre: 'Ta page', texte: 'Clique sur un bloc pour le choisir. Sa poignée bleue permet de le déplacer, et ses boutons de le monter, le copier ou le supprimer.' },
    { cible: '.o-reglages-bande, .o-panneau-reglages', titre: 'Les réglages du bloc', texte: 'Quand un bloc est choisi, ses réglages s’ouvrent ici : texte, image, couleur… Tu peux rabattre cette colonne pour voir ta page en plus grand.' },
    { cible: '.o-barre-page .o-segmente', titre: 'Ordinateur ou téléphone', texte: 'Vérifie que ta page est belle aussi sur un téléphone.' },
    { cible: '[data-aide="annuler"]', titre: 'Tu t’es trompé ?', texte: '« Annuler » revient en arrière, autant de fois que nécessaire.' },
  ],
  5: [
    { cible: '.o-controle-liste', titre: 'Vérifie ton site', texte: 'Vitrine vérifie ton site pour toi. Ce qui manque est en rouge, en haut de la liste.' },
    { cible: '.o-verif-ko button', titre: 'Corrige en un clic', texte: 'Ce bouton t’emmène directement à l’endroit à corriger.' },
    { cible: '[data-aide="enregistrer-carte"]', titre: 'Enregistre ton projet', texte: 'Pour continuer à la prochaine séance, enregistre ton projet dans ton dossier.' },
    { cible: '[data-aide="exporter"]', titre: 'Exporte ton site', texte: 'Quand ton site est prêt, exporte-le : tu obtiens un dossier zippé. Ouvre-le, puis double-clique sur « index.html » pour voir ton site.' },
  ],
};

export interface Question { partie: Etape | 0; q: string; r: string[] }

/** Questions fréquentes. partie 0 = valable partout. Chaque réponse est une suite d'étapes courtes. */
export const QUESTIONS: Question[] = [
  { partie: 0, q: 'Comment enregistrer mon travail ?', r: ['Quand tu crées ton projet, choisis le dossier de ton équipe : ta classe › COMMUN › TECHNOLOGIE › CONCEPT STORE › Prénom_Prénom.', 'Ensuite, ton projet s’enregistre tout seul à chaque modification : le bouton en haut à droite affiche « Enregistré ».', 'Si le bouton affiche « Enregistrer » avec un point orange, clique dessus.'] },
  { partie: 0, q: 'Comment reprendre mon projet à la séance suivante ?', r: ['Ouvre Vitrine.', 'Clique sur « Ouvrir mon projet ».', 'Choisis ton fichier, celui qui se termine par .vitrine.'] },
  { partie: 0, q: 'Comment voir mon site en grand ?', r: ['Clique sur « Aperçu », en haut à droite.', 'Choisis « Ordinateur » ou « Téléphone ». Les liens du menu fonctionnent.', 'Ferme avec « Fermer l’aperçu » ou la touche Échap.'] },
  { partie: 0, q: 'Dans quel ordre dois-je travailler ?', r: ['Il n’y a pas d’ordre obligatoire : passe d’une partie à l’autre avec les onglets du haut.', 'Seuls le nom du site, la classe et les prénoms du groupe sont demandés au début.'] },

  { partie: 2, q: 'Comment choisir mes couleurs ?', r: ['Dans « Couleurs et polices », clique sur une palette.', 'Ajuste ensuite la couleur principale et l’accent avec les pastilles, ou « Autre ».', 'Pour tout choisir toi-même, clique sur « Ma palette ».'] },
  { partie: 2, q: 'Pourquoi un message orange sur ma couleur ?', r: ['Ta couleur principale se lit mal sur le fond : les titres et les liens seront difficiles à lire.', 'Clique sur « Foncer la couleur pour moi », ou choisis une couleur plus foncée.'] },
  { partie: 2, q: 'Comment ajouter une police de Google Fonts ?', r: ['Dans « 3. Tes polices », clique sur « Mes polices ».', 'Sur fonts.google.com, choisis une police, puis « Get font » et « Download all ».', 'Dans Vitrine, clique sur « Importer une police » et choisis le fichier qui finit par -Regular.ttf.'] },
  { partie: 2, q: 'Comment créer mon logo ?', r: ['Ouvre l’onglet « Mon logo ».', 'Choisis un symbole (cherche-le par son nom), une mise en page et des couleurs.', 'Dans « Personnaliser », règle la police, la taille, la forme…'] },
  { partie: 2, q: 'Comment télécharger mon logo ?', r: ['Dans l’onglet « Mon logo », descends jusqu’à « Télécharger mon logo ».', 'Le PNG à fond transparent va dans un diaporama, sur la maquette 3D, ou s’imprime pour la maquette en carton.'] },

  { partie: 3, q: 'Comment ajouter une page ?', r: ['Dans « Pages », écris le nom de la page en bas, dans « Ajouter une page à toi ».', 'Choisis « Dans le menu principal ».', 'Clique sur « Ajouter ».'] },
  { partie: 3, q: 'Comment créer une sous-page ?', r: ['Ajoute une page en choisissant « Sous-page de… ».', 'Ou, sur la ligne d’une page existante, change « Menu principal » en « Sous « … » ».', 'Elle apparaîtra dans un sous-menu.'] },
  { partie: 3, q: 'Comment changer l’ordre du menu ?', r: ['Dans « Pages », utilise les flèches à droite de chaque page.', 'L’accueil reste toujours en premier.'] },

  { partie: 4, q: 'Comment ajouter un bloc ?', r: ['Dans la liste de gauche, glisse un bloc à l’endroit voulu sur la page.', 'Ou clique dessus : il s’ajoute en bas de la page.'] },
  { partie: 4, q: 'Comment modifier un bloc ?', r: ['Clique sur le bloc, dans la page.', 'Ses réglages s’ouvrent dans la colonne de droite : change le texte, l’image, la couleur…', 'Tout se met à jour en direct.'] },
  { partie: 4, q: 'Comment mettre des blocs côte à côte ?', r: ['Ajoute un bloc « Colonnes » (en haut de la liste).', 'Choisis 2 ou 3 colonnes dans ses réglages.', 'Remplis chaque colonne : clique sur un choix rapide, ou glisse un bloc dedans. Tu peux en mettre autant que tu veux.'] },
  { partie: 4, q: 'Comment ajouter une image ?', r: ['Ajoute un bloc « Image avec légende » (ou choisis une image dans un autre bloc).', 'Dans les réglages, clique sur « Choisir une image ».', 'Écris ce qu’on voit dans « Description de l’image » : c’est obligatoire.'] },
  { partie: 4, q: 'Que veut dire « Description manquante » ?', r: ['L’image n’a pas encore de description.', 'Clique sur l’image, puis écris ce qu’on voit dans « Description de l’image ». Cette phrase est lue aux personnes qui ne voient pas l’image.'] },
  { partie: 4, q: 'Comment déplacer un bloc ?', r: ['Clique sur le bloc.', 'Attrape sa poignée bleue (en haut à gauche) et glisse-le, ou utilise les flèches en haut à droite.'] },
  { partie: 4, q: 'Comment partir d’un modèle ?', r: ['Clique sur « Modèles », au-dessus de la page.', 'Choisis un modèle : sur une page qui a déjà des blocs, choisis « Ajouter à la suite » ou « Remplacer ma page ».', 'Remplace ensuite les textes et les images par les tiens.'] },
  { partie: 4, q: 'Comment proposer un produit en plusieurs couleurs ?', r: ['Clique sur le bloc « Fiches produits », puis sur le produit dans les réglages.', 'Clique sur « + Ajouter des déclinaisons » : donne un nom à chaque déclinaison (Rouge, Bleu…), choisis la couleur de sa pastille et sa photo.', 'Sur le site, un clic sur une pastille montre la photo de cette couleur.'] },
  { partie: 4, q: 'Comment changer la couleur d’un texte ?', r: ['Clique sur le bloc de texte.', 'Dans les réglages, va à « Couleur du texte » et choisis une couleur.', 'Si un message orange apparaît, ton texte se lit mal : choisis une autre couleur.'] },
  { partie: 4, q: 'Je me suis trompé, comment revenir en arrière ?', r: ['Clique sur « Annuler », au-dessus de la page (ou appuie sur Ctrl + Z).', 'Tu peux annuler plusieurs fois de suite.'] },

  { partie: 5, q: 'Que veulent dire les points rouges ?', r: ['Ce sont les choses qui manquent sur ton site.', 'Clique sur le bouton de la ligne pour aller directement les corriger.', 'Tu peux exporter même s’il reste des points rouges, mais ton site sera moins réussi.'] },
  { partie: 5, q: 'Comment exporter mon site ?', r: ['Clique sur « Exporter mon site ».', 'Un fichier .zip arrive dans ton dossier Téléchargements.', 'Ouvre-le, puis double-clique sur « index.html » pour voir ton site.'] },
];
