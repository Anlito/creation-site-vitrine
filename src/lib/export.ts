// Export du site : un dossier HTML statique (une page par page du site), zippé et téléchargé.
import { strToU8, zipSync } from 'fflate';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fichiersPages, pagesActives, paletteDe, policesDe, slug, surCouleur, type Img, type Projet } from '../model';
import { fichiersPourPaire, fontFace, POLICES_SITE } from '../polices';
import { PageSite } from '../site/Site';
import siteCss from '../site/site.css?raw';
import { telecharger } from './fichier';
import { logoPng, symbolePng } from './logo-image';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

function dataUrlVersOctets(d: string): { octets: Uint8Array; ext: string } {
  const [entete, donnees] = d.split(',', 2);
  const mime = entete.slice(5).split(';')[0];
  const base64 = entete.includes(';base64');
  const bin = base64 ? atob(donnees) : decodeURIComponent(donnees);
  const octets = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
  return { octets, ext: EXT[mime] ?? 'png' };
}

const echapper = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Petit carré du logo en PNG 32 px pour l'onglet du navigateur. */
async function favicon(p: Projet): Promise<Uint8Array> {
  if (!p.logo.image_importee) return new Uint8Array(await (await symbolePng(p, 32)).arrayBuffer());
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d')!;
  const im = new Image();
  im.src = p.logo.image_importee;
  await im.decode().catch(() => undefined);
  const k = Math.min(32 / im.naturalWidth, 32 / im.naturalHeight) || 1;
  const w = im.naturalWidth * k, h = im.naturalHeight * k;
  ctx.drawImage(im, (32 - w) / 2, (32 - h) / 2, w, h);
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'));
  return new Uint8Array(await (blob ?? new Blob()).arrayBuffer());
}

/**
 * Fichiers du site statique (chemins relatifs : index.html, style.css, images/…, polices/…).
 * Sert à l'export, et à l'outil professeur de Concept Store qui affiche le site d'une équipe.
 */
export async function fabriquerSite(p: Projet): Promise<Record<string, Uint8Array>> {
  const fichiers: Record<string, Uint8Array> = {};
  const pages = fichiersPages(p);
  const ajouter = (chemin: string, contenu: Uint8Array | string) => {
    fichiers[chemin] = typeof contenu === 'string' ? strToU8(contenu) : contenu;
  };

  // Images : une seule copie par image, nommées dans l'ordre d'apparition.
  const images = new Map<string, string>();
  const src = (im: Img) => {
    if (!im.src) return null;
    let chemin = images.get(im.src);
    if (!chemin) {
      const { octets, ext } = dataUrlVersOctets(im.src);
      chemin = `images/image-${images.size + 1}.${ext}`;
      images.set(im.src, chemin);
      ajouter(chemin, octets);
    }
    return chemin;
  };
  let srcLogo: string | undefined;
  if (p.logo.image_importee) {
    const { octets, ext } = dataUrlVersOctets(p.logo.image_importee);
    srcLogo = `images/logo.${ext}`;
    ajouter(srcLogo, octets);
  }

  // Polices de la charte, embarquées pour que le site s'affiche sans connexion.
  const faces: string[] = [];
  const policeLogo = p.logo.police;
  const integrees = [...fichiersPourPaire(p.charte), ...POLICES_SITE.filter((x) => x.famille === policeLogo)];
  for (const f of integrees.filter((x, i) => integrees.indexOf(x) === i)) {
    const octets = new Uint8Array(await (await fetch(f.url)).arrayBuffer());
    ajouter(`polices/${f.fichier}`, octets);
    faces.push(fontFace(f, `polices/${f.fichier}`));
  }
  // Polices importées par l'élève (seulement celles qui servent).
  const pp = policesDe(p.charte);
  for (const f of p.charte.policesImportees ?? []) {
    if (!pp.titre.includes(`'${f.famille}'`) && !pp.texte.includes(`'${f.famille}'`) && f.famille !== policeLogo) continue;
    const { octets } = dataUrlVersOctets(f.donnees);
    const ext = { woff2: 'woff2', woff: 'woff', truetype: 'ttf', opentype: 'otf' }[f.format];
    const nomFichier = `${slug(f.famille, 'police')}.${ext}`;
    ajouter(`polices/${nomFichier}`, octets);
    faces.push(`@font-face{font-family:'${f.famille}';font-style:normal;font-weight:100 900;font-display:swap;src:url("polices/${nomFichier}") format("${f.format}")}`);
  }
  const fond = paletteDe(p.charte).fond;
  ajouter('style.css', `${faces.join('\n')}\nhtml,body{margin:0;min-height:100%}\nbody{background:${fond};color-scheme:${surCouleur(fond) === '#FFFFFF' ? 'dark' : 'light'}}\nbody>.site{min-height:100vh}\n${siteCss}`);

  for (const pg of pagesActives(p)) {
    const corps = renderToStaticMarkup(createElement(PageSite, {
      c: { p, page: pg, outil: false, src, srcLogo, lien: (id: string | null) => (id && pages[id]) || undefined },
    })).replace(/<link rel="preload"[^>]*>/g, ''); // indices de préchargement ajoutés par React, inutiles ici
    const titre = `${echapper(p.logo.texte.trim() || p.nom)} · ${echapper(pg.nom)}`;
    ajouter(pages[pg.id], `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<link rel="icon" type="image/png" href="favicon.png">
<link rel="stylesheet" href="style.css">
</head>
<body>
${corps}
</body>
</html>
`);
  }

  ajouter('favicon.png', await favicon(p));
  if (!p.logo.image_importee) {
    ajouter('logo.png', new Uint8Array(await (await logoPng(p)).arrayBuffer()));
  }
  ajouter('LISEZ-MOI.txt', `Site de ${p.nom}, créé avec Vitrine.\r\n\r\nPour voir le site : ouvre le fichier index.html (double-clic).\r\nPour le mettre en ligne : envoie tout le contenu de ce dossier, sans rien renommer.\r\n`);

  return fichiers;
}

export async function exporterSite(p: Projet): Promise<string> {
  const dossier = slug(p.nom);
  const fichiers: Record<string, Uint8Array> = {};
  for (const [chemin, octets] of Object.entries(await fabriquerSite(p))) fichiers[`${dossier}/${chemin}`] = octets;
  const zip = zipSync(fichiers, { level: 6 });
  const nom = `${dossier}-site.zip`;
  telecharger(nom, new Blob([zip as BlobPart], { type: 'application/zip' }));
  return nom;
}
