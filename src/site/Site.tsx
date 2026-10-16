// Rendu du site généré. Les mêmes composants servent à l'aperçu dans l'outil,
// à l'aperçu de l'espace enseignant et aux pages HTML exportées.
import { Icon } from '../components/Icon';
import {
  blocsVisibles, colonnesVisibles, declinaisonsDe, menuSite, pagesActives, variablesFondPrincipal, variablesSite,
  type Bloc, type BlocColonnes, type Img, type Page, type Produit, type Projet,
} from '../model';
import { LogoSite } from './Logo';

export interface CtxSite {
  p: Projet;
  page: Page;
  /** Dans l'outil : pas de vrais liens, badges « Description manquante » visibles. */
  outil: boolean;
  /** Adresse d'une page du site (export) ; absent dans l'outil. */
  lien?: (pageId: string | null) => string | undefined;
  /** Adresse d'une image (export : fichier dans le dossier images). */
  src?: (img: Img) => string | null;
  srcLogo?: string;
  /** Niveaux de titre de la page (h1 / h2), calculés une fois pour toute la page. */
  niv?: Record<string, 1 | 2>;
  /** Dans l'éditeur : dessine une colonne (bloc modifiable ou case vide). */
  rendreColonne?: (blocs: Bloc[], k: number, parent: BlocColonnes) => React.ReactNode;
}

const srcDe = (c: CtxSite, i: Img) => (c.src ? c.src(i) : i.src);
const hrefDe = (c: CtxSite, id: string | null) => (c.lien ? c.lien(id) : undefined);

/** Un seul H1 par page : le premier bandeau, sinon le premier « Grand titre ». */
export function niveauxTitres(page: Page): Record<string, 1 | 2> {
  const r: Record<string, 1 | 2> = {};
  const aBandeau = page.blocs.some((b) => b.type === 'banniere');
  let h1 = false;
  for (const b of blocsVisibles(page.blocs)) {
    if (b.type === 'banniere') { r[b.id] = h1 ? 2 : 1; h1 = true; }
    else if (b.type === 'titre') {
      if (b.grand && !aBandeau && !h1) { r[b.id] = 1; h1 = true; } else r[b.id] = 2;
    }
  }
  return r;
}

export function SiteEntete({ c }: { c: CtxSite }) {
  const menu = menuSite(c.p);
  const accueil = hrefDe(c, 'accueil');
  const actuelle = (id: string) => (id === c.page.id ? 'page' as const : undefined);
  const lienMobile = (pg: Page, sous = false) => (
    <a href={hrefDe(c, pg.id)} aria-current={actuelle(pg.id)} className={sous ? 's-menu-sous' : undefined}>
      {pg.id === c.page.id ? <span className="s-menu-actif"><span className="s-menu-barre" />{pg.nom}</span> : <>{pg.nom}<Icon n="chevron_right" size={24} /></>}
    </a>
  );
  return (
    <header className="s-top">
      <a className="s-logo-lien" href={accueil} aria-label={c.outil ? undefined : `${c.p.logo.texte || c.p.nom}, accueil`}>
        <LogoSite p={c.p} taille="entete" srcLogo={c.srcLogo} />
      </a>
      <nav className="s-nav" aria-label="Menu principal">
        <ul>
          {menu.map(({ page: pg, enfants }) => (
            <li key={pg.id} className={enfants.length ? 's-nav-groupe' : undefined}>
              <a
                href={hrefDe(c, pg.id)}
                aria-current={actuelle(pg.id)}
                className={enfants.some((e) => e.id === c.page.id) ? 's-nav-parent-actif' : undefined}
              >
                {pg.nom}{enfants.length > 0 && <Icon n="expand_more" size={20} />}
              </a>
              {enfants.length > 0 && (
                <ul className="s-sous-menu">
                  {enfants.map((e) => <li key={e.id}><a href={hrefDe(c, e.id)} aria-current={actuelle(e.id)}>{e.nom}</a></li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <details className="s-menu">
        <summary>
          <span className="s-menu-ouvrir"><Icon n="menu" />Menu</span>
          <span className="s-menu-fermer"><Icon n="close" />Fermer</span>
        </summary>
        <nav className="s-menu-panneau" aria-label="Menu principal">
          <ul>
            {menu.map(({ page: pg, enfants }) => (
              <li key={pg.id}>
                {lienMobile(pg)}
                {enfants.length > 0 && <ul>{enfants.map((e) => <li key={e.id}>{lienMobile(e, true)}</li>)}</ul>}
              </li>
            ))}
          </ul>
        </nav>
      </details>
    </header>
  );
}

export function SitePied({ c }: { c: CtxSite }) {
  const classe = c.p.meta.classe?.trim();
  return (
    <footer className="s-pied">
      <div className="s-pied-info">
        <LogoSite p={c.p} taille="pied" srcLogo={c.srcLogo} />
        <span className="s-pied-mention">Projet Concept Store 4.0{classe ? ` · Classe de ${classe}` : ''} · Magasin fictif</span>
      </div>
      <nav aria-label="Pages du site">
        <ul className="s-pied-nav">
          {pagesActives(c.p).map((pg) => <li key={pg.id}><a href={hrefDe(c, pg.id)}>{pg.nom}</a></li>)}
        </ul>
      </nav>
    </footer>
  );
}

function Image({ c, img, cls }: { c: CtxSite; img: Img; cls: string }) {
  const s = srcDe(c, img);
  const badge = c.outil && !img.alt.trim() && (
    <span className="o-badge-alt"><Icon n="error" size={20} />Description manquante</span>
  );
  if (s) {
    return (
      <div className={`${cls} s-img-boite`}>
        <img src={s} alt={img.alt} />
        {badge}
      </div>
    );
  }
  return (
    <div
      className={`${cls} s-ph`}
      role={!c.outil && img.alt.trim() ? 'img' : undefined}
      aria-label={!c.outil && img.alt.trim() ? img.alt : undefined}
      aria-hidden={!c.outil && !img.alt.trim() ? true : undefined}
    >
      <span className="s-ph-texte">{img.nom}</span>
      {badge}
    </div>
  );
}

/**
 * Photos d'un produit en plusieurs déclinaisons, avec des pastilles pour choisir.
 * Fonctionne sans JavaScript (boutons radio et CSS), y compris dans le site exporté.
 */
function Declinaisons({ c, blocId, produit }: { c: CtxSite; blocId: string; produit: Produit }) {
  const decl = declinaisonsDe(produit)!;
  const nom = `d-${blocId}-${produit.id}`;
  return (
    <div className="s-decl" role="group" aria-label={`Déclinaisons de ${produit.nom}`}>
      {decl.map((d, i) => (
        <input key={d.id} type="radio" className="s-decl-radio" name={nom} id={`${nom}-${i}`} defaultChecked={i === 0} />
      ))}
      <div className="s-decl-images">
        {decl.map((d) => <Image key={d.id} c={c} img={d.image} cls="s-produit-img" />)}
      </div>
      <div className="s-decl-bas">
        <div className="s-decl-choix">
          {decl.map((d, i) => (
            <label
              key={d.id}
              htmlFor={`${nom}-${i}`}
              className={`s-decl-pastille${d.couleur ? '' : ' sans-couleur'}`}
              style={d.couleur ? ({ '--c': d.couleur } as React.CSSProperties) : undefined}
              title={d.nom}
            >
              {d.couleur ? <span className="s-masque">{d.nom}</span> : d.nom}
            </label>
          ))}
        </div>
        <div className="s-decl-noms" aria-hidden="true">Choix : {decl.map((d) => <span key={d.id} className="s-decl-nom">{d.nom}</span>)}</div>
      </div>
    </div>
  );
}

function Titre({ niveau, className, children }: { niveau: 1 | 2; className: string; children: React.ReactNode }) {
  return niveau === 1 ? <h1 className={className}>{children}</h1> : <h2 className={className}>{children}</h2>;
}

/** Contenu d'un bloc (sans l'enveloppe de fond). */
export function ContenuBloc({ c, b, niveau }: { c: CtxSite; b: Bloc; niveau: 1 | 2 }) {
  switch (b.type) {
    case 'banniere':
      return (
        <div className="s-bandeau">
          <Image c={c} img={b.image} cls="s-bandeau-img" />
          <div className="s-bandeau-carte">
            <Titre niveau={niveau} className="s-h s-bandeau-titre">{b.slogan}</Titre>
            {b.sous.trim() && <p className="s-bandeau-sous">{b.sous}</p>}
            {b.bouton.trim() && (
              <a className="s-btn" href={hrefDe(c, b.cible)}>{b.bouton}<Icon n="arrow_forward" size={20} /></a>
            )}
          </div>
        </div>
      );
    case 'titre':
      return <Titre niveau={niveau} className={`s-h ${b.grand ? 's-titre-grand' : 's-titre'}`}>{b.texte}</Titre>;
    case 'paragraphe':
      return <p className="s-para">{b.texte}</p>;
    case 'image':
      return (
        <figure className="s-figure">
          <Image c={c} img={b.image} cls="s-figure-img" />
          {b.legende.trim() && <figcaption>{b.legende}</figcaption>}
        </figure>
      );
    case 'liste':
      return (
        <ul className="s-liste">
          {b.elements.filter((e) => e.trim()).map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      );
    case 'bouton':
      return (
        <p className="s-bouton-ligne">
          <a className="s-btn" href={hrefDe(c, b.cible)}>{b.texte}<Icon n="arrow_forward" size={20} /></a>
        </p>
      );
    case 'produits':
      return (
        <div className="s-produits">
          <div className="s-produits-grille">
            {b.produits.map((x) => (
              <article key={x.id} className="s-produit">
                {declinaisonsDe(x) ? <Declinaisons c={c} blocId={b.id} produit={x} /> : <Image c={c} img={x.image} cls="s-produit-img" />}
                <div className="s-produit-corps">
                  <h3 className="s-h s-produit-nom">{x.nom}</h3>
                  {x.desc.trim() && <p className="s-produit-desc">{x.desc}</p>}
                  {x.prix.trim() && <span className="s-produit-prix">{x.prix}</span>}
                </div>
              </article>
            ))}
          </div>
          <p className="s-produits-mention">Les prix sont fictifs.</p>
        </div>
      );
    case 'cartes':
      return (
        <div className={`s-cartes s-cartes-${b.style}`}>
          {b.cartes.map((k) => (
            <div key={k.id} className="s-carte">
              {b.style === 'image'
                ? <Image c={c} img={k.image} cls="s-carte-img" />
                : <span className="s-carte-icone"><Icon n={k.icone} size={26} /></span>}
              <div className="s-carte-corps">
                {k.titre.trim() && <h3 className="s-h s-carte-titre">{k.titre}</h3>}
                {k.texte.trim() && <p className="s-carte-texte">{k.texte}</p>}
                {k.cible && <a className="s-carte-lien" href={hrefDe(c, k.cible)}>Découvrir<Icon n="arrow_forward" size={20} /></a>}
              </div>
            </div>
          ))}
        </div>
      );
    case 'horaires':
      return (
        <div className="s-infos">
          {b.adresse.trim() && (
            <div className="s-info">
              <h3 className="s-h s-info-titre"><Icon n="location_on" size={26} />Adresse</h3>
              <p className="s-info-texte">{b.adresse}</p>
              {b.acces.trim() && <p className="s-info-acces">{b.acces}</p>}
            </div>
          )}
          {b.horaires.length > 0 && (
            <div className="s-info">
              <h3 className="s-h s-info-titre"><Icon n="schedule" size={26} />Horaires</h3>
              <dl className="s-horaires">
                {b.horaires.map((h, i) => <div key={i}><dt>{h.jour}</dt><dd>{h.heures}</dd></div>)}
              </dl>
            </div>
          )}
        </div>
      );
    case 'formulaire':
      return (
        <form className="s-form" aria-label={b.titre || 'Formulaire de contact'}>
          {b.titre.trim() && <h3 className="s-h s-form-titre">{b.titre}</h3>}
          <label>Ton nom<input type="text" name="nom" autoComplete="name" readOnly={c.outil} tabIndex={c.outil ? -1 : undefined} /></label>
          <label>Ton adresse e-mail<input type="email" name="email" autoComplete="email" readOnly={c.outil} tabIndex={c.outil ? -1 : undefined} /></label>
          <label>Ton message<textarea name="message" rows={4} readOnly={c.outil} tabIndex={c.outil ? -1 : undefined} /></label>
          <button type="button" className="s-btn" tabIndex={c.outil ? -1 : undefined}>{b.bouton.trim() || 'Envoyer'}</button>
          <p className="s-form-note"><Icon n="info" size={20} />Formulaire d'exemple : aucun message n'est vraiment envoyé.</p>
        </form>
      );
    case 'citation':
      return (
        <figure className="s-citation">
          <Icon n="format_quote" size={40} className="s-citation-icone" />
          <blockquote className="s-h">{b.texte}</blockquote>
          {b.auteur.trim() && <figcaption>{b.auteur}</figcaption>}
        </figure>
      );
    case 'separateur':
      return b.style === 'ligne' ? <hr className="s-separateur" /> : <div className="s-espace" aria-hidden="true" />;
    case 'colonnes':
      return (
        <div className={`s-ligne s-ligne-${b.n}${b.n === 2 && b.repartition !== 'egal' ? ` s-ligne-2${b.repartition === 'gauche' ? 'g' : 'd'}` : ''}`}>
          {colonnesVisibles(b).map((col, k) => (
            <div key={k} className="s-colonne">
              {c.rendreColonne ? c.rendreColonne(col, k, b) : col.map((x) => <SiteBloc key={x.id} c={c} b={x} niveau={c.niv?.[x.id] ?? 2} />)}
            </div>
          ))}
        </div>
      );
    case 'galerie':
      return (
        <div className={`s-galerie s-galerie-${b.n}`}>
          {b.images.slice(0, b.n).map((im, i) => <Image key={i} c={c} img={im} cls="s-galerie-img" />)}
        </div>
      );
  }
}

/** Bloc avec son fond (sans fond, couleur douce, couleur principale). */
export function SiteBloc({ c, b, niveau }: { c: CtxSite; b: Bloc; niveau: 1 | 2 }) {
  const style: Record<string, string> = b.fond === 'principale' ? variablesFondPrincipal(c.p) : {};
  // Couleur du texte choisie par l'élève : elle remplace celle de la charte pour ce bloc.
  if (b.couleur) Object.assign(style, { color: b.couleur, '--ink': b.couleur, '--muted': b.couleur });
  return (
    <div className={`s-b s-b-${b.type} s-fond-${b.fond}${b.alignement && b.alignement !== 'gauche' ? ` s-align-${b.alignement}` : ''}`} style={style as React.CSSProperties}>
      <ContenuBloc c={c} b={b} niveau={niveau} />
    </div>
  );
}

/** Page complète (export et espace enseignant). */
export function PageSite({ c }: { c: CtxSite }) {
  const niv = niveauxTitres(c.page);
  const cn = { ...c, niv };
  return (
    <div className="site" style={variablesSite(c.p) as React.CSSProperties}>
      <SiteEntete c={c} />
      <main className="s-main">
        {c.page.blocs.map((b) => <SiteBloc key={b.id} c={cn} b={b} niveau={niv[b.id] ?? 2} />)}
      </main>
      <SitePied c={c} />
    </div>
  );
}
