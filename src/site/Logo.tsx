// Logo du concept store : en grand (aperçu), dans l'en-tête du site, et en tout petit (onglet du navigateur).
import { Icon } from '../components/Icon';
import { contraste, corrigerContraste, eclaircir, paletteDe, policesDe, surCouleur, type Logo, type Projet } from '../model';

export interface CouleursLogo { c1: string; c2: string; t: string }

function luminance01(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

export function fondsLogo(p: Projet) {
  const pal = paletteDe(p.charte);
  return {
    clair: luminance01(pal.fond) > 0.5 ? pal.fond : '#FFFFFF',
    fonce: luminance01(pal.texte) < 0.5 ? pal.texte : pal.fond,
  };
}

/** Couleurs du logo selon le fond : couleurs de la charte, un seul ton, ou couleurs choisies par l'élève. */
export function couleursLogo(p: Projet, fonce: boolean): CouleursLogo {
  const pal = paletteDe(p.charte);
  const pri = p.charte.principale;
  const { clair, fonce: sombre } = fondsLogo(p);
  // Couleur de texte foncée de la palette (pour les palettes sombres, c'est le fond).
  const encre = luminance01(pal.texte) < 0.5 ? pal.texte : pal.fond;
  const L = p.logo;
  if (L.couleurs === 'un-ton') {
    return fonce ? { c1: '#FFFFFF', c2: sombre, t: '#FFFFFF' } : { c1: encre, c2: clair, t: encre };
  }
  if (L.couleurs === 'perso') {
    const sym = L.couleurSymbole ?? pri;
    const txt = L.couleurTexte ?? encre;
    const fond = fonce ? sombre : clair;
    // Sur l'autre fond, on garde les couleurs choisies tant qu'elles restent lisibles.
    const c1 = contraste(sym, fond) >= 2 ? sym : fonce ? eclaircir(sym) : corrigerContraste(sym, fond);
    const t = contraste(txt, fond) >= 3 ? txt : fonce ? '#FFFFFF' : encre;
    return { c1, c2: surCouleur(c1), t };
  }
  if (fonce) {
    const c1 = luminance01(pri) < 0.35 ? eclaircir(pri) : pri;
    return { c1, c2: surCouleur(c1), t: '#FFFFFF' };
  }
  const c1 = contraste(pri, clair) < 3 ? corrigerContraste(pri, clair) : pri;
  return { c1, c2: surCouleur(c1), t: encre };
}

export type FormeSymbole = NonNullable<Logo['forme']>;

/** Réglages de mise en forme du logo (valeurs par défaut tirées de la charte). */
export function styleLogo(p: Projet) {
  const L = p.logo;
  const pol = policesDe(p.charte);
  const forme: FormeSymbole = L.forme ?? (L.mise_en_page === 'carre' ? 'arrondi' : 'rond');
  return {
    police: L.police ? `'${L.police}', sans-serif` : pol.titre,
    graisse: L.graisse === 'gras' ? 700 : L.graisse === 'normal' ? 400 : Number(pol.graisse),
    casse: (L.majuscules ? 'uppercase' : L.police ? 'none' : pol.casse) as React.CSSProperties['textTransform'],
    espacement: `${L.espacement ?? 0}em`,
    kTexte: L.tailleTexte ?? 1,
    kSymbole: L.tailleSymbole ?? 1,
    forme,
    sousTitre: L.sousTitre?.trim() ?? '',
    policeTexte: pol.texte,
  };
}

/** Rayon de la forme derrière le symbole, pour une taille donnée. */
export const rayonForme = (forme: FormeSymbole, taille: number) =>
  forme === 'rond' ? taille / 2 : forme === 'arrondi' ? Math.round(taille * 0.22) : 0;

const texteLogo = (p: Projet) => (p.logo.texte.trim() || p.nom);

/** Logo en grand, dans l'une des 5 mises en page. */
export function LogoGrand({ p, fonce }: { p: Projet; fonce: boolean }) {
  const { c1, c2, t } = couleursLogo(p, fonce);
  const s = styleLogo(p);
  const f: React.CSSProperties = { fontFamily: s.police, fontWeight: s.graisse, textTransform: s.casse, letterSpacing: s.espacement, lineHeight: 1.05, color: t };
  const sous = s.sousTitre && (
    <span style={{ fontFamily: s.policeTexte, fontSize: Math.round(16 * Math.max(1, s.kTexte * 0.9)), letterSpacing: '.08em', textTransform: 'uppercase', color: t, opacity: 0.85 }}>{s.sousTitre}</span>
  );
  const sym = p.logo.symbole;
  const nom = texteLogo(p);
  if (p.logo.image_importee) {
    return <img src={p.logo.image_importee} alt={`Logo de ${nom}`} style={{ maxWidth: '80%', maxHeight: 160, objectFit: 'contain' }} />;
  }
  const badge = (base: number, icone: number) => {
    if (!sym) return null;
    const taille = Math.round(base * s.kSymbole);
    if (s.forme === 'aucune') return <Icon n={sym} size={Math.round(icone * 1.25 * s.kSymbole)} style={{ color: c1, flex: '0 0 auto' }} />;
    return (
      <span style={{ width: taille, height: taille, borderRadius: rayonForme(s.forme, taille), background: c1, color: c2, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
        <Icon n={sym} size={Math.round(icone * s.kSymbole)} />
      </span>
    );
  };
  const taille = (base: number, seuil?: number) => Math.round(tailleTexte(nom, base, seuil) * s.kTexte);
  switch (p.logo.mise_en_page) {
    case 'dessus':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          {badge(84, 52)}
          <span style={{ ...f, fontSize: taille(36) }}>{nom}</span>
          {sous}
        </div>
      );
    case 'texte':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ ...f, fontSize: taille(40) }}>{nom}</span>
          {sous}
          <span style={{ width: 72, height: 6, background: c1 }} />
        </div>
      );
    case 'rond':
      return (
        <div style={{ width: 176, height: 176, borderRadius: '50%', border: `5px solid ${c1}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 14, textAlign: 'center' }}>
          {sym && <Icon n={sym} size={Math.round(46 * s.kSymbole)} style={{ color: c1 }} />}
          <span style={{ ...f, fontSize: taille(24, 10) }}>{nom}</span>
          {sous}
        </div>
      );
    case 'carre':
      return (
        <div style={{ width: 176, height: 176, borderRadius: rayonForme(s.forme === 'aucune' ? 'carre' : s.forme, 176) / 2, background: c1, color: c2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, textAlign: 'center' }}>
          {sym && <Icon n={sym} size={Math.round(48 * s.kSymbole)} />}
          <span style={{ ...f, color: c2, fontSize: taille(22, 10) }}>{nom}</span>
          {s.sousTitre && <span style={{ fontFamily: s.policeTexte, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase', color: c2 }}>{s.sousTitre}</span>}
        </div>
      );
    default:
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {badge(64, 40)}
          <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ ...f, fontSize: taille(38), whiteSpace: 'nowrap' }}>{nom}</span>
            {sous}
          </span>
        </div>
      );
  }
}

/** Réduit le texte quand le nom est long, pour qu'il tienne dans l'aperçu. */
function tailleTexte(nom: string, base: number, seuil = 14) {
  return nom.length <= seuil ? base : Math.max(16, Math.round(base * Math.sqrt(seuil / nom.length)));
}

/** Petit carré du symbole seul (onglet du navigateur, aperçu du menu). */
export function MarqueLogo({ p, taille, icone }: { p: Projet; taille: number; icone: number }) {
  const { c1, c2 } = couleursLogo(p, false);
  const s = styleLogo(p);
  if (p.logo.image_importee) {
    return <img src={p.logo.image_importee} alt="" style={{ width: taille, height: taille, objectFit: 'contain', borderRadius: 4 }} />;
  }
  // En tout petit, le symbole garde toujours un fond pour rester visible.
  const rayon = rayonForme(s.forme === 'aucune' ? 'rond' : s.forme, taille);
  if (!p.logo.symbole) {
    return (
      <span style={{ width: taille, height: taille, borderRadius: rayon, background: c1, color: c2, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: Math.round(taille * 0.6), lineHeight: 1 }}>
        {texteLogo(p).charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span style={{ width: taille, height: taille, borderRadius: rayon, background: c1, color: c2, display: 'grid', placeItems: 'center' }}>
      <Icon n={p.logo.symbole} size={icone} />
    </span>
  );
}

/** Logo dans l'en-tête et le pied de page du site (couleurs de la charte via les variables CSS). */
export function LogoSite({ p, taille, srcLogo }: { p: Projet; taille: 'entete' | 'pied'; srcLogo?: string }) {
  const nom = texteLogo(p);
  const L = p.logo;
  const s = styleLogo(p);
  const cls = `s-logo s-logo-${taille}`;
  // Tailles bornées : le logo doit rester raisonnable dans la barre du site.
  const kT = Math.min(1.35, Math.max(0.75, s.kTexte));
  const kS = Math.min(1.35, Math.max(0.75, s.kSymbole));
  const base = taille === 'entete' ? { texte: 24, marque: 44, icone: 28 } : { texte: 20, marque: 32, icone: 20 };
  const styleNom: React.CSSProperties = {
    fontFamily: s.police, fontWeight: s.graisse, textTransform: s.casse, letterSpacing: s.espacement,
    fontSize: Math.round(base.texte * kT),
    color: L.couleurs === 'perso' && L.couleurTexte ? L.couleurTexte : undefined,
  };
  const sous = s.sousTitre && <span className="s-logo-sous">{s.sousTitre}</span>;
  if (L.image_importee) {
    return (
      <span className={cls}>
        <img className="s-logo-img" src={srcLogo ?? L.image_importee} alt="" />
        <span className="s-logo-textes"><span className="s-logo-nom" style={styleNom}>{nom}</span>{sous}</span>
      </span>
    );
  }
  let marque = null;
  if (L.symbole && L.mise_en_page !== 'texte') {
    const t = Math.round(base.marque * kS);
    const perso = L.couleurs === 'perso';
    const unTon = L.couleurs === 'un-ton';
    const sansFond = s.forme === 'aucune' || L.mise_en_page === 'rond';
    const couleur = perso ? (L.couleurSymbole ?? p.charte.principale) : unTon ? 'var(--ink)' : 'var(--pri)';
    const style: React.CSSProperties = sansFond
      ? { width: t, height: t, background: 'transparent', color: couleur, border: L.mise_en_page === 'rond' ? `3px solid ${couleur}` : 0, borderRadius: '50%' }
      : { width: t, height: t, background: couleur, color: perso ? surCouleur(couleur) : unTon ? 'var(--bg)' : 'var(--onpri)', borderRadius: rayonForme(s.forme, t) };
    marque = <span className="s-logo-marque" style={style}><Icon n={L.symbole} size={Math.round(base.icone * kS)} /></span>;
  }
  return (
    <span className={cls}>
      {marque}
      <span className="s-logo-textes"><span className="s-logo-nom" style={styleNom}>{nom}</span>{sous}</span>
    </span>
  );
}
