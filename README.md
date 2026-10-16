# Vitrine

Outil web qui permet aux élèves de 4e de créer le site vitrine de leur concept store (projet de technologie « Concept Store 4.0 »). Il n'y a ni compte, ni serveur, ni installation. (Les maquettes de design d'origine ne sont pas publiées dans ce dépôt.)

## Utiliser l'outil

Le fichier **`dist/index.html`** contient tout l'outil, polices et icônes comprises. Il fonctionne hors ligne.

- **En classe** : copiez-le sur les postes (ou dans un dossier partagé), puis ouvrez-le par double-clic dans Chrome ou Firefox.
- **En ligne** : l'outil est publié automatiquement sur **GitHub Pages** à chaque envoi sur la branche `main` (voir `.github/workflows/pages.yml`). Une adresse en `https://` permet aux élèves de choisir leur dossier d'enregistrement (Chrome, Edge). Il peut aussi être déposé sur n'importe quel hébergement de fichiers statiques (ENT…).

Ce que l'élève récupère :
- **Enregistrer** télécharge un fichier `nom-du-projet.vitrine`. C'est du JSON, images comprises. L'élève le rouvre à la séance suivante avec « Ouvrir mon projet ».
- **Exporter mon site** télécharge `nom-du-projet-site.zip`. Il contient :
  - une page HTML par page du site ;
  - `style.css` ;
  - les polices de la charte ;
  - les images ;
  - `favicon.png` et `logo.png` ;
  - un `LISEZ-MOI.txt`.

  Le site s'ouvre sans connexion.
- **Espace enseignant** (lien en bas à droite de l'accueil, **protégé par un mot de passe**) :
  - **tableau de bord** : les projets déjà évalués (classe, équipe, note, contrôles réussis, date), filtre par classe, moyenne, suppression d'une évaluation ;
  - **évaluation d'un projet** : aperçu du site en lecture seule (ordinateur ou téléphone, liste des pages), grille sur 20, contrôle automatique (9 points, problèmes expliqués), commentaire, puis « Équipe suivante » ;
  - les évaluations sont gardées dans le navigateur, et retrouvées si l'on rouvre le fichier d'une équipe ;
  - export CSV de la classe affichée (séparateur `;`, UTF-8 avec BOM, pour Excel FR).

## Livrable pour les classes

`npm run livrable` recompile l'outil et fabrique `livrables/Vitrine-vX.Y.Z/` (dossier prêt à copier) et `livrables/Vitrine-vX.Y.Z.zip` :

- `Vitrine/index.html` : l'outil ;
- `LISEZ-MOI - Installation.html` : installation sur le serveur d'une classe, navigateurs, vérification, espace enseignant, mise à jour, dépannage ;
- `Fiche élève - Bien démarrer.html` : une page A4 pour la première séance.

Les deux documents sont dans `livraison/` (`{{VERSION}}` et `{{DATE}}` sont remplacés automatiquement). Pour une nouvelle version, changer `version` dans `package.json` puis relancer `npm run livrable`.

## Publication sur GitHub

- Dépôt public ; le dossier `maquettes/` (fichiers de design reçus) et les réglages locaux restent hors du dépôt (`.gitignore`).
- GitHub Pages : dans le dépôt, **Settings › Pages › Source : GitHub Actions**. Chaque envoi sur `main` recompile et republie l'outil.
- Le mot de passe de l'espace enseignant n'est pas une protection forte : dans un dépôt public, son empreinte est lisible.

## Développer

Le projet réutilise le Node portable de ConceptStore3D :

```bash
export PATH="/c/Users/pc/Documents/ConceptStore3D/.tools/node-v22.23.3-win-x64:$PATH"
npm run dev      # serveur de développement : http://localhost:5173
npm run build    # icônes + vérification TypeScript + dist/index.html
```

Stack : React 19, TypeScript, Vite 8 et `vite-plugin-singlefile` (un seul fichier HTML). `fflate` sert à fabriquer le zip.

| Dossier | Contenu |
|---|---|
| `src/data/constantes.ts` | Palettes, paires de polices, symboles, blocs, pages proposées, grille d'évaluation |
| `src/model.ts` | Format du fichier `.vitrine`, contrastes, variables CSS de la charte |
| `src/etat.tsx` | État de l'application et historique d'annulation |
| `src/screens/` | Les écrans : Accueil, Nommer/Démarrer, Charte (+ logo), Structure, Éditeur, Contrôle, Enseignant |
| `src/site/` | Rendu du site généré (composants + `site.css`), partagé entre l'aperçu, l'espace enseignant et l'export |
| `src/lib/` | Fichiers `.vitrine`, réduction des images, contrôles automatiques, export zip |
| `scripts/build-icons.mjs` | Extrait les pictogrammes Material Symbols Rounded utilisés vers `src/icons.gen.ts` |

## Ajouts demandés après les maquettes

- **Aide pour une première utilisation** :
  - **visite guidée** de chaque partie (Mon projet, Charte graphique, Pages, Contenu, Vérifier et exporter) : chaque zone est mise en lumière avec une bulle d'explication, « Suivant / Précédent / Passer », touches flèches et Échap ;
  - quand un élève **crée** un projet, une carte en bas à droite lui propose la visite la première fois qu'il ouvre chaque partie (« Lancer la visite » / « Non merci ») ;
  - bouton **« Aide »** dans la barre du haut : questions fréquentes (celles de la partie en cours d'abord), recherche, et relance de la visite.
  - Textes des visites et des questions : `src/data/aide.ts`.

- **Pas d'ordre imposé** : la barre du haut contient des onglets sans numéros (Mon projet, Charte graphique, Pages, Contenu, Vérifier et exporter) et plus de bouton « Suivant ». Seul le début est imposé : à la création, **le nom du site, la classe et les prénoms du groupe sont obligatoires**. L'onglet « Mon projet » propose ensuite de commencer par la partie que l'on veut. Une 9ᵉ vérification contrôle ces trois informations (colonne « Infos du groupe » dans le CSV).

- **13 blocs**, rangés par familles dans la liste de gauche :
  - Texte : bandeau, titre, paragraphe, liste, **citation** ;
  - Images : image avec légende, galerie ;
  - Présenter : **cartes** (icône ou image, titre, texte, lien), **fiches produits**, **adresse et horaires**, **formulaire de contact** (exemple, sans envoi) ;
  - Navigation et mise en page : bouton vers une page, **séparateur**.
- **Bloc « Colonnes »** (famille « Mise en page ») : 2 ou 3 colonnes, de largeurs égales ou avec une colonne large. **Chaque colonne est une pile : on y met autant de blocs que l'on veut** (bouton « Ajouter dans la colonne », choix rapides, ou glisser-déposer depuis la liste). Dans une colonne, un bloc peut monter, descendre, passer dans la colonne voisine ou être retiré. Sur téléphone, les colonnes passent l'une sous l'autre. Les fichiers des premiers essais sont convertis automatiquement à l'ouverture.
- **Modèles de page** (bouton « Modèles » de l'éditeur, ou « Choisir un modèle » sur une page vide) : 11 modèles conseillés selon la page (Accueil, Le concept, Nos produits, Contact, L'équipe, Nos événements) et 3 modèles généraux. Sur une page qui a déjà du contenu, l'élève choisit « Ajouter à la suite » ou « Remplacer ma page » (on peut annuler).
- **Onglet « Pages »** (anciennement Structure) : on coche les pages, on les range (flèches), et on peut **créer des sous-pages** (« Sous « Le concept » »). Les sous-pages forment un **sous-menu** : il se déroule au survol ou au clavier sur ordinateur, et les sous-pages sont décalées dans le menu téléphone. Un seul niveau de sous-pages. Une page décochée cache aussi ses sous-pages. Le bouton « Remplir avec des modèles » donne un modèle conseillé à chaque page cochée encore vide.
- **Aperçu en plein écran** : icône « œil » dans la barre du haut, à toutes les étapes. Il montre le site tel que les visiteurs le verront, sur ordinateur ou sur téléphone. Les liens du menu changent de page. On ferme avec « Fermer l'aperçu » ou la touche Échap.

- **Colonne de réglages escamotable** (Contenu) : sans bloc choisi, elle reste en bande étroite « Réglages » (toujours visible, elle s'ouvre d'un clic et affiche « Aucun bloc choisi »). Quand un bloc est choisi, elle s'ouvre ; le bouton « Rabattre » la remet en bande.
- **Liste des pages** dans l'éditeur : une liste déroulante « Page : » remplace les onglets (pas de défilement, même avec beaucoup de pages).
- **Enregistrement dans le dossier de l'équipe, puis automatique** (Chrome et Edge) : le clic sur « Créer mon projet » ouvre la fenêtre « Enregistrer sous » (dossier conseillé : `4X › COMMUN › TECHNOLOGIE › CONCEPT STORE › Prénom_Prénom`, réglable dans `dossierConseille`, `src/data/constantes.ts`). Ensuite, chaque modification est enregistrée automatiquement dans ce fichier (2,5 s après) ; le bouton affiche « Enregistré ». Un projet rouvert avec « Ouvrir mon projet » demande un clic sur « Enregistrer » pour autoriser l'écriture, puis s'enregistre tout seul. Sans fichier (Firefox, fenêtre fermée, droit refusé), une **copie de secours** est gardée dans le navigateur (IndexedDB) et l'accueil propose de la reprendre.
- **Ma palette** : l'élève choisit lui-même le fond, la couleur principale et l'accent. Texte, surfaces et lignes sont calculés pour rester lisibles.
- **Mes polices** : choix libre d'une police pour les titres et d'une pour le texte, et import de polices gratuites (.ttf, .otf, .woff, .woff2, 2 Mo maximum) téléchargées sur Google Fonts. Le fichier est rangé dans le projet et embarqué dans le site exporté : rien n'est chargé depuis Google, ni dans l'outil ni sur le site.
- **Alignement** des blocs Titre, Paragraphe, Liste, Citation, Bouton vers une page et Image avec légende : à gauche (par défaut), centré ou à droite.
- **Couleur du texte** sur les blocs Titre, Paragraphe, Liste, Citation, Cartes, Adresse et horaires : celle de la charte par défaut, ou une autre (pastilles ou « Autre »), avec un avertissement si le contraste avec le fond du bloc est insuffisant.

- **162 symboles pour le logo**, rangés en 12 catégories (Nature, Alimentation, Mode et beauté, Loisirs et jeux, Sport, Musique et art, Maison, Technologie, Animaux, Commerce, Voyage, Formes et signes), avec une recherche par nom en français. La liste se trouve dans `src/data/symboles.json` (nom Material Symbols + nom français) ; après l'avoir modifiée, `npm run build` régénère les icônes.
- **Déclinaisons de produits** (bloc Fiches produits) : un produit peut avoir jusqu'à 8 déclinaisons (couleur, modèle…), chacune avec son nom, la couleur de sa pastille (ou son nom écrit) et sa photo. Sur le site, un clic sur une pastille change la photo ; cela fonctionne sans JavaScript, y compris dans le site exporté. Le modèle « Catalogue » en montre un exemple.
- **Logo plus libre** (onglet Mon logo, partie « Personnaliser ») : phrase sous le nom, police du logo (toutes les polices, y compris les polices importées), gras, majuscules, taille du texte, taille du symbole, espacement des lettres, forme derrière le symbole (rond, arrondi, carré, sans fond), et « Mes couleurs » (couleur du symbole et couleur du texte au choix). Un bouton remet les réglages de départ.
- **Télécharger le logo** : PNG haute définition à fond transparent (environ 2400 px de large), version sur fond foncé, et symbole seul en carré (1024 px). Pour l'oral, la maquette 3D ou l'impression sur la maquette en carton. Le zip du site contient aussi `logo.png`.

Les modèles sont définis dans `src/data/modeles.ts` : on peut en ajouter facilement.

## Écarts par rapport aux maquettes

- **Classe et équipe** : champs facultatifs ajoutés sous le nom du projet (écran 1b et étape « Démarrer »). Ils alimentent le pied de page du site et l'export CSV de l'enseignant.
- **Étape 1 « Démarrer »** quand un projet est ouvert : elle sert à renommer le projet ou à revenir à l'accueil. Un avertissement s'affiche si le travail n'est pas enregistré.
- **Bandeau d'accueil** : ajout de « Mène vers la page » pour que son bouton ait une destination.
- **Galerie** : chaque image a sa propre ligne de réglage (image et description) dans le panneau de droite, pour que le contrôle des descriptions s'applique aussi aux galeries.
- **Bloc « Fiches produits »** (8e bloc, ajouté à la demande) : une grille de cartes produit, avec image, nom, description et prix dans une pastille, comme dans le gabarit C. Une mention « Les prix sont fictifs. » est ajoutée automatiquement. Sur la page « Nos produits » vide, un raccourci propose d'ajouter des fiches produits.
- **Pages ajoutées par l'élève** : elles peuvent être supprimées (icône corbeille).
- **Fermeture de l'onglet** : le navigateur demande une confirmation s'il reste des changements non enregistrés.
- **« Foncer la couleur pour moi »** : sur une palette sombre (Arcade, Minuit), la couleur est éclaircie au lieu d'être foncée.

## Point qui était à trancher

Les gabarits du site généré (catalogue avec prix, horaires, formulaire de contact, cartes d'accès rapide) montrent des contenus que les 7 blocs de l'éditeur ne permettent pas de créer. Réglé : les blocs Fiches produits, Cartes, Adresse et horaires et Formulaire de contact couvrent maintenant les 4 gabarits.

## Mot de passe de l'espace enseignant

Il est demandé une fois par séance (jusqu'à ce que la page soit rechargée). Le bouton « Verrouiller » le redemande tout de suite. Seule son empreinte (SHA-256) est écrite dans l'outil, pas le mot de passe lui-même. Pour le changer, il faut calculer l'empreinte de « vitrine: » suivi du nouveau mot de passe, la mettre dans `src/lib/verrou.ts`, puis recompiler.

Attention : comme l'outil fonctionne sans serveur, ce verrou empêche d'entrer par erreur ou par curiosité, mais ce n'est pas une protection forte. Un élève très motivé pourrait la contourner, d'autant qu'un code à 4 chiffres se devine facilement. L'espace enseignant ne contient de toute façon aucune donnée tant qu'on n'y a pas ouvert de fichier : les évaluations sont gardées dans le navigateur du poste où elles ont été faites.
