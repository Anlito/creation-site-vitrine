// Images du logo à télécharger (PNG haute définition à fond transparent, fond foncé, symbole seul).
// Le logo est d'abord « composé » en formes, symboles et textes placés au pixel près, puis dessiné sur un canevas.
import { ICONS } from '../icons.gen';
import { slug, type Projet } from '../model';
import { couleursLogo, fondsLogo, rayonForme, styleLogo } from '../site/Logo';
import { telecharger } from './fichier';

type Element =
  | { type: 'forme'; x: number; y: number; l: number; h: number; r: number; fond?: string; trait?: string; epaisseur?: number }
  | { type: 'icone'; nom: string; x: number; y: number; taille: number; couleur: string }
  | { type: 'texte'; texte: string; x: number; y: number; taille: number; police: string; graisse: number; couleur: string; centre: boolean; espacement: number };

interface Composition { largeur: number; hauteur: number; elements: Element[] }

let mesureur: CanvasRenderingContext2D | null = null;
function largeurTexte(texte: string, taille: number, police: string, graisse: number, espacement: number) {
  mesureur ??= document.createElement('canvas').getContext('2d')!;
  mesureur.font = `${graisse} ${taille}px ${police}`;
  return mesureur.measureText(texte).width + espacement * taille * Math.max(0, texte.length - 1);
}

/** Place tous les éléments du logo (unités : pixels à l'échelle 1, marge comprise). */
function composer(p: Projet, fonce: boolean): Composition {
  const { c1, c2, t } = couleursLogo(p, fonce);
  const s = styleLogo(p);
  const majuscules = s.casse === 'uppercase';
  const nom = (p.logo.texte.trim() || p.nom);
  const nomAffiche = majuscules ? nom.toLocaleUpperCase('fr-FR') : nom;
  const sous = s.sousTitre.toLocaleUpperCase('fr-FR');
  const esp = parseFloat(s.espacement) || 0;
  const sym = p.logo.symbole;
  const marge = 16;
  const el: Element[] = [];
  const texte = (txt: string, x: number, y: number, taille: number, couleur: string, centre: boolean, police = s.police, graisse = s.graisse, espacement = esp): Element =>
    ({ type: 'texte', texte: txt, x, y, taille, police, graisse, couleur, centre, espacement });
  const mesure = (txt: string, taille: number, police = s.police, graisse = s.graisse, espacement = esp) => largeurTexte(txt, taille, police, graisse, espacement);

  // Symbole avec sa forme (ou sans fond)
  const symbole = (x: number, y: number, base: number, icone: number) => {
    if (!sym) return 0;
    const taille = Math.round(base * s.kSymbole);
    if (s.forme === 'aucune') {
      const ti = Math.round(icone * 1.25 * s.kSymbole);
      el.push({ type: 'icone', nom: sym, x, y: y + (taille - ti) / 2, taille: ti, couleur: c1 });
      return ti;
    }
    el.push({ type: 'forme', x, y, l: taille, h: taille, r: rayonForme(s.forme, taille), fond: c1 });
    const ti = Math.round(icone * s.kSymbole);
    el.push({ type: 'icone', nom: sym, x: x + (taille - ti) / 2, y: y + (taille - ti) / 2, taille: ti, couleur: c2 });
    return taille;
  };

  const T = 38 * s.kTexte;
  const S = 16 * Math.max(1, s.kTexte * 0.9);
  const lSous = sous ? mesure(sous, S, s.policeTexte, 400, 0.08) : 0;

  switch (p.logo.mise_en_page) {
    case 'dessus': {
      const B = sym ? (s.forme === 'aucune' ? Math.round(52 * 1.25 * s.kSymbole) : Math.round(84 * s.kSymbole)) : 0;
      const Tn = 36 * s.kTexte;
      const lNom = mesure(nomAffiche, Tn);
      const largeur = Math.max(B, lNom, lSous);
      const cx = marge + largeur / 2;
      let y = marge;
      if (sym) { symbole(cx - B / 2, y, 84, 52); y += B + 10; }
      el.push(texte(nomAffiche, cx, y + Tn * 0.55, Tn, t, true)); y += Tn * 1.1;
      if (sous) { y += 6; el.push(texte(sous, cx, y + S * 0.6, S, t, true, s.policeTexte, 400, 0.08)); y += S * 1.2; }
      return { largeur: largeur + marge * 2, hauteur: y + marge, elements: el };
    }
    case 'texte': {
      const Tn = 40 * s.kTexte;
      const lNom = mesure(nomAffiche, Tn);
      let y = marge;
      el.push(texte(nomAffiche, marge, y + Tn * 0.55, Tn, t, false)); y += Tn * 1.1;
      if (sous) { y += 6; el.push(texte(sous, marge, y + S * 0.6, S, t, false, s.policeTexte, 400, 0.08)); y += S * 1.2; }
      y += 8;
      el.push({ type: 'forme', x: marge, y, l: 72, h: 6, r: 0, fond: c1 }); y += 6;
      return { largeur: Math.max(lNom, lSous, 72) + marge * 2, hauteur: y + marge, elements: el };
    }
    case 'rond':
    case 'carre': {
      const D = 176;
      const rond = p.logo.mise_en_page === 'rond';
      const couleurTexte = rond ? t : c2;
      if (rond) el.push({ type: 'forme', x: marge + 2.5, y: marge + 2.5, l: D - 5, h: D - 5, r: (D - 5) / 2, trait: c1, epaisseur: 5 });
      else el.push({ type: 'forme', x: marge, y: marge, l: D, h: D, r: rayonForme(s.forme === 'aucune' ? 'carre' : s.forme, D) / 2, fond: c1 });
      // Le nom rétrécit pour tenir dans la forme.
      let Tn = (rond ? 24 : 22) * s.kTexte;
      while (Tn > 10 && mesure(nomAffiche, Tn) > D - 36) Tn -= 1;
      const ti = sym ? Math.round((rond ? 46 : 48) * s.kSymbole) : 0;
      const Ss = rond ? S : 14;
      let hContenu = ti + (ti ? 6 : 0) + Tn * 1.1 + (sous ? 4 + Ss * 1.2 : 0);
      if (hContenu > D - 30) hContenu = D - 30;
      let y = marge + (D - hContenu) / 2;
      const cx = marge + D / 2;
      if (sym) { el.push({ type: 'icone', nom: sym, x: cx - ti / 2, y, taille: ti, couleur: rond ? c1 : c2 }); y += ti + 6; }
      el.push(texte(nomAffiche, cx, y + Tn * 0.55, Tn, couleurTexte, true)); y += Tn * 1.1;
      if (sous) {
        let tailleSous = Ss;
        while (tailleSous > 9 && mesure(sous, tailleSous, s.policeTexte, 400, 0.08) > D - 40) tailleSous -= 1;
        el.push(texte(sous, cx, y + 4 + tailleSous * 0.6, tailleSous, couleurTexte, true, s.policeTexte, 400, 0.08));
      }
      return { largeur: D + marge * 2, hauteur: D + marge * 2, elements: el };
    }
    default: {
      const B = sym ? (s.forme === 'aucune' ? Math.round(40 * 1.25 * s.kSymbole) : Math.round(64 * s.kSymbole)) : 0;
      const lNom = mesure(nomAffiche, T);
      const hTextes = T * 1.1 + (sous ? 6 + S * 1.2 : 0);
      const hauteur = Math.max(B, hTextes);
      const xT = marge + (B ? B + 14 : 0);
      if (sym) symbole(marge, marge + (hauteur - B) / 2, 64, 40);
      let y = marge + (hauteur - hTextes) / 2;
      el.push(texte(nomAffiche, xT, y + T * 0.55, T, t, false)); y += T * 1.1;
      if (sous) el.push(texte(sous, xT, y + 6 + S * 0.6, S, t, false, s.policeTexte, 400, 0.08));
      return { largeur: xT - marge + Math.max(lNom, lSous) + marge * 2, hauteur: hauteur + marge * 2, elements: el };
    }
  }
}

/** Attend que les polices du logo soient prêtes, pour que le canevas les utilise. */
async function chargerPolices(p: Projet) {
  const s = styleLogo(p);
  await Promise.all([
    document.fonts.load(`${s.graisse} 40px ${s.police}`),
    document.fonts.load(`400 16px ${s.policeTexte}`),
  ]).catch(() => undefined);
}

function dessiner(ctx: CanvasRenderingContext2D, c: Composition, k: number, fond?: string) {
  if (fond) { ctx.fillStyle = fond; ctx.fillRect(0, 0, c.largeur * k, c.hauteur * k); }
  ctx.save();
  ctx.scale(k, k);
  for (const e of c.elements) {
    if (e.type === 'forme') {
      ctx.beginPath();
      ctx.roundRect(e.x, e.y, e.l, e.h, Math.min(e.r, e.l / 2, e.h / 2));
      if (e.fond) { ctx.fillStyle = e.fond; ctx.fill(); }
      if (e.trait) { ctx.strokeStyle = e.trait; ctx.lineWidth = e.epaisseur ?? 1; ctx.stroke(); }
    } else if (e.type === 'icone') {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(e.taille / 960, e.taille / 960);
      ctx.translate(0, 960);
      ctx.fillStyle = e.couleur;
      ctx.fill(new Path2D(ICONS[e.nom] ?? ''));
      ctx.restore();
    } else {
      ctx.font = `${e.graisse} ${e.taille}px ${e.police}`;
      (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${e.espacement * e.taille}px`;
      ctx.fillStyle = e.couleur;
      ctx.textBaseline = 'middle';
      ctx.textAlign = e.centre ? 'center' : 'left';
      ctx.fillText(e.texte, e.x, e.y);
    }
  }
  ctx.restore();
}

async function versPng(c: Composition, largeurCible: number, fond?: string): Promise<Blob> {
  const k = largeurCible / c.largeur;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(c.largeur * k);
  canvas.height = Math.round(c.hauteur * k);
  dessiner(canvas.getContext('2d')!, c, k, fond);
  return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error('image'))), 'image/png'));
}

/** Logo en PNG haute définition (2000 px de large environ), fond transparent ou foncé. */
export async function logoPng(p: Projet, fonce = false): Promise<Blob> {
  await chargerPolices(p);
  const c = composer(p, fonce);
  return versPng(c, Math.max(1200, Math.min(2400, Math.round(c.largeur * 8))), fonce ? fondsLogo(p).fonce : undefined);
}

/** Symbole seul, dans sa forme, en carré (1024 px). */
export async function symbolePng(p: Projet, taille = 1024): Promise<Blob> {
  const { c1, c2 } = couleursLogo(p, false);
  const s = styleLogo(p);
  const forme = s.forme === 'aucune' ? 'rond' : s.forme;
  const el: Element[] = [{ type: 'forme', x: 0, y: 0, l: 100, h: 100, r: rayonForme(forme, 100), fond: c1 }];
  if (p.logo.symbole) el.push({ type: 'icone', nom: p.logo.symbole, x: 18, y: 18, taille: 64, couleur: c2 });
  else {
    await chargerPolices(p);
    el.push({ type: 'texte', texte: (p.logo.texte || p.nom).charAt(0).toUpperCase(), x: 50, y: 52, taille: 58, police: s.police, graisse: 700, couleur: c2, centre: true, espacement: 0 });
  }
  return versPng({ largeur: 100, hauteur: 100, elements: el }, taille);
}

const nomFichierLogo = (p: Projet, suite: string) => `logo-${slug(p.logo.texte.trim() || p.nom, 'mon-magasin')}${suite}`;

export type TypeTelechargement = 'png' | 'png-fonce' | 'symbole' | 'importe';

/** Télécharge une version du logo et renvoie le nom du fichier. */
export async function telechargerLogo(p: Projet, type: TypeTelechargement): Promise<string> {
  let nom: string;
  let contenu: Blob;
  if (type === 'importe' && p.logo.image_importee) {
    const ext = p.logo.image_importee.startsWith('data:image/png') ? 'png' : 'jpg';
    nom = nomFichierLogo(p, `.${ext}`);
    contenu = await (await fetch(p.logo.image_importee)).blob();
  } else if (type === 'symbole') {
    nom = nomFichierLogo(p, '-symbole.png');
    contenu = await symbolePng(p);
  } else {
    nom = nomFichierLogo(p, type === 'png-fonce' ? '-fond-fonce.png' : '.png');
    contenu = await logoPng(p, type === 'png-fonce');
  }
  telecharger(nom, contenu);
  return nom;
}
