// Étape 4 — Éditeur de page : liste des blocs | aperçu modifiable | réglages du bloc.
import { useEffect, useRef, useState } from 'react';
import { Barre, BandeauMessage } from '../components/Barre';
import { Icon } from '../components/Icon';
import { FAMILLES_BLOCS, ICONES_CARTES, TYPES_AVEC_COULEUR, TYPES_BLOCS, TYPES_EN_COLONNE, typeBloc, type TypeBloc } from '../data/constantes';
import { useProjet } from '../etat';
import { choisirFichier } from '../lib/fichier';
import { poidsLisible, preparerImage } from '../lib/image';
import {
  COULEURS_DECLINAISONS, MAX_DECLINAISONS, colonnesVisibles, contraste, dupliquer, majBloc, nomDansListe, nouveauBloc, nouvelleCarte,
  nouvelleDeclinaison, nouveauProduit, pagesActives, paletteDe,
  trouverBloc, variablesSite, type Bloc, type BlocColonnes, type Declinaison, type Fond, type Img, type Page, type Produit, type Projet,
} from '../model';
import { niveauxTitres, SiteBloc, SiteEntete, SitePied, type CtxSite } from '../site/Site';
import { CharteRapide } from './Charte';
import { PanneauModeles } from './Modeles';

type Glisse = { type: 'nouveau'; bloc: TypeBloc } | { type: 'deplacement'; id: string };

export function Editeur() {
  const { projet, ui, setUi, maj, annuler, peutAnnuler } = useProjet();
  const [glisse, setGlisse] = useState<Glisse | null>(null);
  const [depot, setDepot] = useState<number | null>(null);
  const actives = pagesActives(projet);
  const page: Page = actives.find((p) => p.id === ui.pageId) ?? actives[0] ?? projet.pages[0];
  const trouve = trouverBloc(page.blocs, ui.sel);
  // Sans bloc choisi, la colonne de réglages reste en bande étroite (on peut l'ouvrir) ; sinon elle s'ouvre, sauf si on l'a rabattue.
  const sansBloc = ui.panneau === 'bloc' && !trouve;
  const reduit = sansBloc ? !ui.reglagesOuvertsSansBloc : ui.reglagesReduits;
  const ouvrirReglages = () => setUi(sansBloc ? { reglagesOuvertsSansBloc: true } : { reglagesReduits: false });
  const rabattreReglages = () => setUi(sansBloc ? { reglagesOuvertsSansBloc: false } : { reglagesReduits: true });

  // Raccourci Ctrl+Z (hors des champs de saisie, qui gardent leur propre annulation).
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) {
        e.preventDefault();
        annuler();
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [annuler]);

  const setBlocs = (f: (b: Bloc[]) => Bloc[], cle?: string) =>
    maj((p): Projet => ({ ...p, pages: p.pages.map((pg) => (pg.id === page.id ? { ...pg, blocs: f(pg.blocs) } : pg)) }), cle);

  const selectionner = (id: string | null) => setUi({ sel: id, panneau: 'bloc' });
  const cibleParDefaut = () => actives.find((p) => p.id !== page.id)?.id ?? null;

  const inserer = (type: TypeBloc, at: number) => {
    const b = nouveauBloc(type, cibleParDefaut());
    setBlocs((bl) => { const a = [...bl]; a.splice(at, 0, b); return a; });
    selectionner(b.id);
    defilerVers(b.id);
  };
  const ajouter = (type: TypeBloc) => inserer(type, page.blocs.length);

  /** Ajoute un nouveau bloc en bas de la colonne k d'un bloc Colonnes. */
  const remplirColonne = (parentId: string, k: number, type: TypeBloc) => {
    const b = nouveauBloc(type, cibleParDefaut());
    setBlocs((bl) => majBloc(bl, parentId, (x) => (x.type === 'colonnes' ? { ...x, colonnes: x.colonnes.map((col, n) => (n === k ? [...col, b] : col)) } : x)));
    selectionner(b.id);
  };

  /** Passe un bloc dans la colonne de gauche (-1) ou de droite (+1), en bas de la pile. */
  const changerColonne = (id: string, d: number) => setBlocs((bl) => {
    const t = trouverBloc(bl, id);
    if (!t?.parent) return bl;
    const p = t.parent; const k2 = t.colonne + d;
    if (k2 < 0 || k2 >= p.n) return bl;
    const cols = p.colonnes.map((col) => [...col]);
    const [m] = cols[t.colonne].splice(t.index, 1);
    cols[k2].push(m);
    return majBloc(bl, p.id, () => ({ ...p, colonnes: cols }));
  });

  const finGlisse = () => { setGlisse(null); setDepot(null); };
  const deposer = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!glisse || depot == null) return finGlisse();
    if (glisse.type === 'nouveau') inserer(glisse.bloc, depot);
    else {
      const de = page.blocs.findIndex((b) => b.id === glisse.id);
      let at = depot;
      if (de >= 0) {
        if (at > de) at--;
        setBlocs((bl) => { const a = [...bl]; const [m] = a.splice(de, 1); a.splice(at, 0, m); return a; });
        selectionner(glisse.id);
      }
    }
    finGlisse();
  };

  // Monter / Descendre (sur la page, ou dans la pile d'une colonne).
  const deplacer = (id: string, d: number) => setBlocs((bl) => {
    const t = trouverBloc(bl, id);
    if (t?.parent) {
      const p = t.parent; const col = [...p.colonnes[t.colonne]]; const j = t.index + d;
      if (j < 0 || j >= col.length) return bl;
      [col[t.index], col[j]] = [col[j], col[t.index]];
      return majBloc(bl, p.id, () => ({ ...p, colonnes: p.colonnes.map((c, n) => (n === t.colonne ? col : c)) }));
    }
    const i = bl.findIndex((b) => b.id === id); const j = i + d;
    if (i < 0 || j < 0 || j >= bl.length) return bl;
    const a = [...bl]; [a[i], a[j]] = [a[j], a[i]]; return a;
  });
  const supprimer = (id: string) => {
    const parent = trouverBloc(page.blocs, id)?.parent;
    setBlocs((bl) => majBloc(bl, id, () => null));
    selectionner(parent?.id ?? null);
  };
  const copier = (id: string) => {
    const b = page.blocs.find((x) => x.id === id);
    if (!b) return;
    const c = dupliquer(b);
    setBlocs((bl) => { const a = [...bl]; a.splice(bl.findIndex((x) => x.id === id) + 1, 0, c); return a; });
    selectionner(c.id);
  };

  return (
    <div className="o-ecran o-ecran-fixe">
      <Barre />
      <BandeauMessage />
      <div className="o-barre-page">
        <label className="o-choix-page">
          <span className="o-c-2">Page :</span>
          <select className="o-champ o-select-page" value={page.id} onChange={(e) => setUi({ pageId: e.target.value, sel: null })}>
            {actives.map((p) => (
              <option key={p.id} value={p.id}>{nomDansListe(projet, p)}{p.blocs.length === 0 ? ' (vide)' : ''}</option>
            ))}
          </select>
          <span className="o-c-2 o-nowrap-texte">{actives.length} page{actives.length > 1 ? 's' : ''}</span>
        </label>
        <div role="group" aria-label="Aperçu" className="o-segmente">
          {([['ordinateur', 'Ordinateur', 'computer'], ['telephone', 'Téléphone', 'smartphone']] as const).map(([k, label, icon]) => (
            <button key={k} className="o-segment" aria-pressed={ui.appareil === k} onClick={() => setUi({ appareil: k })}>
              <Icon n={icon} size={20} />{label}
            </button>
          ))}
        </div>
        <div className="o-ligne-boutons">
          <button className="o-btn o-btn-discret o-normal" data-aide="annuler" aria-label="Annuler la dernière action" disabled={!peutAnnuler} onClick={annuler}><Icon n="undo" />Annuler</button>
          <button className="o-btn o-btn-secondaire o-btn-40 o-bascule" data-aide="modeles" aria-pressed={ui.panneau === 'modeles'} onClick={() => setUi({ panneau: ui.panneau === 'modeles' ? 'bloc' : 'modeles' })}>
            <Icon n="view_quilt" />Modèles
          </button>
          <button className="o-btn o-btn-secondaire o-btn-40 o-bascule" aria-pressed={ui.panneau === 'charte'} onClick={() => setUi({ panneau: ui.panneau === 'charte' ? 'bloc' : 'charte' })}>
            <Icon n="palette" />Ma charte
          </button>
        </div>
      </div>

      <div className={`o-editeur${reduit ? ' reglages-reduits' : ''}`}>
        <aside aria-label="Blocs à ajouter" className="o-panneau-blocs">
          <div className="o-entete-panneau o-px4">
            <h2 className="o-t19">Ajouter un bloc</h2>
            <p className="o-aide">Glisse un bloc sur la page, ou clique dessus. Pour modifier un bloc, clique-le sur la page.</p>
          </div>
          {FAMILLES_BLOCS.map((famille) => (
            <div key={famille} className="o-liste-blocs" role="group" aria-label={famille}>
              <span className="o-famille-blocs" aria-hidden="true">{famille}</span>
              {TYPES_BLOCS.filter((t) => t.famille === famille).map((t) => (
                <button
                  key={t.type}
                  data-aide={t.type === 'colonnes' ? 'colonnes' : undefined}
                  className="o-type-bloc"
                  draggable
                  onClick={() => ajouter(t.type)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', t.type);
                    e.dataTransfer.effectAllowed = 'copy';
                    imageDeGlisse(e, t.icon, t.label);
                    setGlisse({ type: 'nouveau', bloc: t.type });
                  }}
                  onDragEnd={finGlisse}
                >
                  <span className="o-type-bloc-icone"><Icon n={t.icon} /></span>
                  <span className="o-type-bloc-label" title={t.desc}>{t.label}</span>
                  <Icon n="drag_indicator" className="o-c-discret" />
                </button>
              ))}
            </div>
          ))}
          <div className="o-astuce">
            <Icon n="lightbulb" className="o-c-action" />
            <span>Pour mettre des blocs côte à côte, ajoute un bloc «&nbsp;Colonnes&nbsp;», puis glisse autant de blocs que tu veux dans chaque colonne.</span>
          </div>
        </aside>

        <main
          aria-label="Aperçu de la page"
          className="o-zone-apercu"
          onClick={() => selectionner(null)}
          onDragOver={(e) => {
            if (!glisse) return;
            e.preventDefault();
            // Sous le dernier bloc, ou sur une page vide : dépôt à la fin.
            if (e.target === e.currentTarget || page.blocs.length === 0) {
              if (depot !== page.blocs.length) setDepot(page.blocs.length);
            }
          }}
          onDrop={deposer}
        >
          <Apercu
            p={projet}
            page={page}
            telephone={ui.appareil === 'telephone'}
            sel={trouve?.bloc.id ?? null}
            glisse={glisse}
            depot={depot}
            setDepot={setDepot}
            deposer={deposer}
            selectionner={selectionner}
            deplacer={deplacer}
            changerColonne={changerColonne}
            supprimer={supprimer}
            copier={copier}
            commencerDeplacement={(id) => setGlisse({ type: 'deplacement', id })}
            finGlisse={finGlisse}
            ajouter={ajouter}
            remplirColonne={(parentId, k, type) => { remplirColonne(parentId, k, type); finGlisse(); }}
            ouvrirModeles={() => setUi({ panneau: 'modeles', sel: null })}
          />
        </main>

        {reduit && (
          <aside aria-label="Réglages (rabattus)" className="o-reglages-bande">
            <button className="o-reglages-ouvrir" onClick={ouvrirReglages} aria-label="Ouvrir les réglages" title="Ouvrir les réglages">
              <Icon n="right_panel_open" />
              <span className="o-texte-vertical">Réglages</span>
            </button>
          </aside>
        )}
        {!reduit && (
        <aside aria-label="Réglages" className="o-panneau-reglages">
          <button className="o-btn o-btn-discret o-rabattre" onClick={rabattreReglages} title="Rabattre la colonne pour voir la page en plus grand">
            <Icon n="right_panel_close" />Rabattre
          </button>
          {ui.panneau === 'charte' ? <CharteRapide /> : ui.panneau === 'modeles' ? (
            <PanneauModeles
              page={page}
              appliquer={(blocs, remplacer) => {
                setBlocs((bl) => (remplacer ? blocs : [...bl, ...blocs]));
                setUi({ sel: null, panneau: 'bloc' });
              }}
            />
          ) : trouve ? (
            <Reglages
              key={trouve.bloc.id}
              b={trouve.bloc}
              parent={trouve.parent}
              colonne={trouve.colonne}
              pages={actives}
              set={(champs, cle) => setBlocs((bl) => majBloc(bl, trouve.bloc.id, (x) => ({ ...x, ...champs } as Bloc)), cle && `${trouve.bloc.id}-${cle}`)}
              supprimer={() => supprimer(trouve.bloc.id)}
              selectionner={selectionner}
              remplirColonne={remplirColonne}
            />
          ) : (
            <div className="o-aucun-bloc">
              <Icon n="ads_click" size={40} className="o-c-discret" />
              <strong>Aucun bloc choisi</strong>
              <span>Clique sur un bloc de la page pour changer son texte, son image ou sa couleur.</span>
            </div>
          )}
        </aside>
        )}
      </div>
    </div>
  );
}

function defilerVers(id: string) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelector(`[data-bloc="${id}"]`)?.scrollIntoView({ block: 'nearest' });
  }));
}

/** Fantôme du bloc pendant le glissement : incliné, avec une ombre. */
function imageDeGlisse(e: React.DragEvent, icon: string, label: string) {
  const src = e.currentTarget as HTMLElement;
  const g = document.createElement('div');
  g.className = 'o-fantome';
  g.innerHTML = `<span class="o-fantome-icone">${src.querySelector('.o-type-bloc-icone')?.innerHTML ?? ''}</span><span>${label.replace(/</g, '&lt;')}</span>`;
  g.dataset.icon = icon;
  document.body.appendChild(g);
  e.dataTransfer.setDragImage(g, 24, 24);
  setTimeout(() => g.remove(), 0);
}

interface PropsApercu {
  p: Projet;
  page: Page;
  telephone: boolean;
  sel: string | null;
  glisse: Glisse | null;
  depot: number | null;
  setDepot: (n: number | null) => void;
  deposer: (e: React.DragEvent) => void;
  selectionner: (id: string | null) => void;
  deplacer: (id: string, d: number) => void;
  changerColonne: (id: string, d: number) => void;
  supprimer: (id: string) => void;
  copier: (id: string) => void;
  commencerDeplacement: (id: string) => void;
  finGlisse: () => void;
  ajouter: (t: TypeBloc) => void;
  remplirColonne: (parentId: string, k: number, t: TypeBloc) => void;
  ouvrirModeles: () => void;
}

function ZoneDepot({ deposer }: { deposer: (e: React.DragEvent) => void }) {
  return (
    <div className="o-zone-depot" onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={deposer}>
      <Icon n="south" />Dépose le bloc ici
    </div>
  );
}

/** Bas d'une colonne : on y glisse un bloc, ou on en choisit un. Grande zone si la colonne est vide. */
function AjoutColonne({ a, parent, k, vide }: { a: PropsApercu; parent: BlocColonnes; k: number; vide: boolean }) {
  const [survol, setSurvol] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const accepte = a.glisse?.type === 'nouveau' && TYPES_EN_COLONNE.includes(a.glisse.bloc);
  const refuse = a.glisse?.type === 'nouveau' && !accepte;
  // Choix rapides, avec des noms courts pour tenir dans une colonne étroite.
  const rapides: [TypeBloc, string][] = [['titre', 'Titre'], ['paragraphe', 'Texte'], ['image', 'Image'], ['liste', 'Liste'], ['bouton', 'Bouton'], ['cartes', 'Cartes']];
  const deposer = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setSurvol(false);
    if (a.glisse?.type === 'nouveau' && accepte) a.remplirColonne(parent.id, k, a.glisse.bloc);
  };
  const surDessus = (e: React.DragEvent) => {
    if (!a.glisse) return;
    e.stopPropagation();
    if (accepte) { e.preventDefault(); setSurvol(true); }
  };
  if (!vide && !a.glisse && !ouvert) {
    return (
      <button className="o-colonne-plus" onClick={(e) => { e.stopPropagation(); setOuvert(true); }}>
        <Icon n="add" size={20} />Ajouter dans la colonne {k + 1}
      </button>
    );
  }
  return (
    <div
      className={`o-colonne-vide${vide ? '' : ' compacte'}${accepte ? ' accepte' : ''}${accepte && survol ? ' survol' : ''}`}
      onClick={(e) => e.stopPropagation()}
      onDragOver={surDessus}
      onDragLeave={() => setSurvol(false)}
      onDrop={deposer}
    >
      {vide ? <strong>Colonne {k + 1}</strong> : <strong>Ajouter dans la colonne {k + 1}</strong>}
      {refuse
        ? <span>Ce bloc ne va pas dans une colonne.</span>
        : accepte ? <span><Icon n="south" size={20} className="o-ic-ligne" /> Dépose le bloc ici</span>
          : <span>Glisse un bloc ici, ou choisis :</span>}
      {!a.glisse && (
        <span className="o-colonne-choix">
          {rapides.map(([t, court]) => (
            <button key={t} className="o-colonne-type" onClick={() => { a.remplirColonne(parent.id, k, t); setOuvert(false); }} aria-label={`Mettre un bloc « ${typeBloc(t).label} » dans la colonne ${k + 1}`} title={typeBloc(t).label}>
              <Icon n={typeBloc(t).icon} size={20} /><span>{court}</span>
            </button>
          ))}
        </span>
      )}
      {!vide && !a.glisse && <button className="o-btn o-btn-discret o-btn-40" onClick={() => setOuvert(false)}>Fermer</button>}
    </div>
  );
}

function Apercu(a: PropsApercu) {
  const niv = niveauxTitres(a.page);
  const enGlisse = !!a.glisse;
  const vide = a.page.blocs.length === 0 && !(enGlisse && a.depot != null);
  const nomSite = a.p.logo.texte.trim() || a.p.nom;

  /** Bloc cliquable de l'aperçu. Dans une colonne : pas de poignée, flèches gauche / droite. */
  const blocModifiable = (b: Bloc, i: number, parent: BlocColonnes | null, k = -1, total = 0) => {
    const choisi = a.sel === b.id && !enGlisse;
    const label = typeBloc(b.type).label;
    const dansColonne = !!parent;
    return (
      <div
        key={b.id}
        data-bloc={b.id}
        className={`o-bloc${choisi ? ' choisi' : ''}${dansColonne ? ' o-bloc-interne' : ''}${a.glisse?.type === 'deplacement' && a.glisse.id === b.id ? ' en-deplacement' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={choisi}
        aria-label={`${label}${dansColonne ? ` (colonne ${k + 1})` : ''} : cliquer pour modifier`}
        onClick={(e) => { e.stopPropagation(); a.selectionner(b.id); }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a.selectionner(b.id); }
        }}
        onDragOver={dansColonne ? undefined : (e) => {
          if (!a.glisse) return;
          e.preventDefault();
          e.stopPropagation();
          const r = e.currentTarget.getBoundingClientRect();
          const at = e.clientY < r.top + r.height / 2 ? i : i + 1;
          if (at !== a.depot) a.setDepot(at);
        }}
        onDrop={dansColonne ? undefined : a.deposer}
      >
        <SiteBloc c={ctx} b={b} niveau={niv[b.id] ?? 2} />
        {choisi && (
          <>
            <span className="o-bloc-contour" aria-hidden="true" />
            {dansColonne ? (
              <span className="o-bloc-poignee o-bloc-etiquette">{label}</span>
            ) : (
              <span
                className="o-bloc-poignee"
                draggable
                title="Glisse pour déplacer le bloc"
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData('text/plain', 'deplacement');
                  e.dataTransfer.effectAllowed = 'move';
                  setTimeout(() => { a.commencerDeplacement(b.id); a.setDepot(i); });
                }}
                onDragEnd={a.finGlisse}
              >
                <Icon n="drag_indicator" />{label}
              </span>
            )}
            <span className="o-bloc-actions" onClick={(e) => e.stopPropagation()}>
              {dansColonne ? (
                <>
                  <button className="o-btn-icone" aria-label="Monter dans la colonne" title="Monter" disabled={i === 0} onClick={() => a.deplacer(b.id, -1)}><Icon n="arrow_upward" size={20} /></button>
                  <button className="o-btn-icone" aria-label="Descendre dans la colonne" title="Descendre" disabled={i === total - 1} onClick={() => a.deplacer(b.id, 1)}><Icon n="arrow_downward" size={20} /></button>
                  <button className="o-btn-icone" aria-label="Passer dans la colonne de gauche" title="Colonne de gauche" disabled={k === 0} onClick={() => a.changerColonne(b.id, -1)}><Icon n="arrow_back" size={20} /></button>
                  <button className="o-btn-icone" aria-label="Passer dans la colonne de droite" title="Colonne de droite" disabled={k === parent.n - 1} onClick={() => a.changerColonne(b.id, 1)}><Icon n="arrow_forward" size={20} /></button>
                  <button className="o-btn-icone o-btn-icone-danger" aria-label="Retirer ce bloc de la colonne" title="Retirer" onClick={() => a.supprimer(b.id)}><Icon n="delete" size={20} /></button>
                </>
              ) : (
                <>
                  <button className="o-btn-icone" aria-label="Monter le bloc" title="Monter" disabled={i === 0} onClick={() => a.deplacer(b.id, -1)}><Icon n="arrow_upward" size={20} /></button>
                  <button className="o-btn-icone" aria-label="Descendre le bloc" title="Descendre" disabled={i === a.page.blocs.length - 1} onClick={() => a.deplacer(b.id, 1)}><Icon n="arrow_downward" size={20} /></button>
                  <button className="o-btn-icone" aria-label="Dupliquer le bloc" title="Dupliquer" onClick={() => a.copier(b.id)}><Icon n="content_copy" size={20} /></button>
                  <button className="o-btn-icone o-btn-icone-danger" aria-label="Supprimer le bloc" title="Supprimer" onClick={() => a.supprimer(b.id)}><Icon n="delete" size={20} /></button>
                </>
              )}
            </span>
          </>
        )}
      </div>
    );
  };

  const ctx: CtxSite = {
    p: a.p, page: a.page, outil: true, niv,
    rendreColonne: (col, k, parent) => (
      <>
        {col.map((x, j) => blocModifiable(x, j, parent, k, col.length))}
        <AjoutColonne a={a} parent={parent} k={k} vide={col.length === 0} />
      </>
    ),
  };

  return (
    <div className={a.telephone ? 'o-cadre-telephone' : 'o-cadre-ordi'}>
      {!a.telephone && (
        <div className="o-barre-adresse" aria-hidden="true">
          <span /><span /><span />
          <span className="o-barre-adresse-texte">{nomSite} · {a.page.nom}</span>
        </div>
      )}
      <div className={`site${a.telephone ? '' : ' force-ordi'}`} style={variablesSite(a.p) as React.CSSProperties}>
        <SiteEntete c={ctx} />
        <div className="s-main">
          {vide && (
            <div className="o-page-vide">
              <Icon n="add_box" size={44} className="o-c-action" />
              <strong>Cette page est vide</strong>
              <span>Pars d'un modèle tout prêt, ou glisse un bloc ici depuis la liste à gauche.</span>
              <div className="o-ligne-boutons o-centre">
                <button className="o-btn o-btn-principal" onClick={(e) => { e.stopPropagation(); a.ouvrirModeles(); }}><Icon n="view_quilt" />Choisir un modèle</button>
                <button className="o-btn o-btn-secondaire" onClick={(e) => { e.stopPropagation(); a.ajouter('titre'); }}>Ajouter un titre</button>
              </div>
            </div>
          )}
          {a.page.blocs.map((b, i) => (
            <div key={b.id} className="o-bloc-groupe">
              {enGlisse && a.depot === i && <ZoneDepot deposer={a.deposer} />}
              {blocModifiable(b, i, null)}
            </div>
          ))}
          {enGlisse && a.depot === a.page.blocs.length && <ZoneDepot deposer={a.deposer} />}
        </div>
        <SitePied c={ctx} />
      </div>
    </div>
  );
}

// ——— Réglages du bloc choisi ———

interface PropsReglages {
  b: Bloc;
  /** Bloc Colonnes qui contient ce bloc (null s'il est directement sur la page). */
  parent: BlocColonnes | null;
  colonne: number;
  pages: Page[];
  set: (champs: Partial<Bloc>, cle?: string) => void;
  supprimer: () => void;
  selectionner: (id: string | null) => void;
  remplirColonne: (parentId: string, k: number, t: TypeBloc) => void;
}

function Reglages({ b, parent, colonne, pages, set, supprimer, selectionner, remplirColonne }: PropsReglages) {
  const { projet, ui, setUi } = useProjet();
  const t = typeBloc(b.type);
  const reduction = ui.reduction?.blocId === b.id ? ui.reduction : null;

  const changerImage = async (actuelle: Img, appliquer: (i: Img) => void) => {
    const f = await choisirFichier('image/*');
    if (!f) return;
    try {
      const im = await preparerImage(f);
      appliquer({ ...actuelle, src: im.src, nom: im.nom });
      setUi({ reduction: im.reduite ? { blocId: b.id, avant: im.avant, apres: im.apres } : null });
    } catch {
      setUi({ reduction: null });
    }
  };

  const fonds: { k: Fond; label: string; couleur: string }[] = [
    { k: 'aucun', label: 'Sans fond', couleur: variablesSite(projet)['--bg'] },
    { k: 'douce', label: 'Couleur douce', couleur: variablesSite(projet)['--surf'] },
    { k: 'principale', label: 'Couleur principale', couleur: projet.charte.principale },
  ];

  return (
    <>
      {parent && (
        <button className="o-btn o-btn-discret o-retour-colonnes" onClick={() => selectionner(parent.id)}>
          <Icon n="arrow_back" />Revenir aux colonnes
        </button>
      )}
      <div className="o-reglages-entete">
        <span className="o-reglages-icone"><Icon n={t.icon} /></span>
        <div className="o-reglages-titres"><span className="o-c-2">{parent ? `Dans la colonne ${colonne + 1}` : 'Bloc choisi'}</span><h2 className="o-t19">{t.label}</h2></div>
      </div>

      {b.type === 'colonnes' && (
        <>
          <div className="o-champ-groupe" role="group" aria-labelledby={`nbcol-${b.id}`}>
            <span id={`nbcol-${b.id}`} className="o-libelle">Nombre de colonnes</span>
            <div className="o-segmente o-segmente-plein">
              {([2, 3] as const).map((n) => (
                <button key={n} className="o-segment o-segment-38" aria-pressed={b.n === n} onClick={() => set({ n })}>{n} colonnes</button>
              ))}
            </div>
            {b.n === 2 && b.colonnes[2]?.length > 0 && <span className="o-aide">La 3ᵉ colonne est gardée de côté : repasse à 3 colonnes pour la retrouver.</span>}
          </div>
          {b.n === 2 && (
            <div className="o-champ-groupe" role="group" aria-labelledby={`rep-${b.id}`}>
              <span id={`rep-${b.id}`} className="o-libelle">Largeur des colonnes</span>
              <div className="o-colonne o-gap6">
                {([['egal', 'Égales', [1, 1]], ['gauche', 'Large à gauche', [2, 1]], ['droite', 'Large à droite', [1, 2]]] as const).map(([k, label, parts]) => (
                  <button key={k} className="o-carte-choix o-fond" aria-pressed={b.repartition === k} onClick={() => set({ repartition: k })}>
                    <span className="o-mini-colonnes" aria-hidden="true">{parts.map((p, i) => <span key={i} style={{ flex: p }} />)}</span>{label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="o-champ-groupe" role="group" aria-labelledby={`cols-${b.id}`}>
            <span id={`cols-${b.id}`} className="o-libelle">Contenu des colonnes</span>
            {colonnesVisibles(b).map((col, k) => (
              <fieldset key={k} className="o-fiche">
                <legend className="o-fiche-titre"><span>Colonne {k + 1}</span><span className="o-c-2 o-normal">{col.length} bloc{col.length > 1 ? 's' : ''}</span></legend>
                {col.map((x) => (
                  <div key={x.id} className="o-ligne-colonne">
                    <span className="o-flex1"><Icon n={typeBloc(x.type).icon} size={20} className="o-ic-ligne" /> {typeBloc(x.type).label}</span>
                    <button className="o-btn o-btn-secondaire o-btn-40" onClick={() => selectionner(x.id)}>Modifier</button>
                  </div>
                ))}
                <select className="o-champ" value="" aria-label={`Ajouter un bloc dans la colonne ${k + 1}`} onChange={(e) => e.target.value && remplirColonne(b.id, k, e.target.value as TypeBloc)}>
                  <option value="">+ Ajouter un bloc…</option>
                  {TYPES_EN_COLONNE.map((tc) => <option key={tc} value={tc}>{typeBloc(tc).label}</option>)}
                </select>
              </fieldset>
            ))}
            <span className="o-aide">Mets autant de blocs que tu veux dans chaque colonne. Tu peux aussi les glisser depuis la liste de gauche. Sur téléphone, les colonnes passent l'une sous l'autre.</span>
          </div>
        </>
      )}

      {reduction && (
        <div role="status" className="o-msg o-msg-info">
          <Icon n="compress" />
          <span><strong>Image réduite automatiquement.</strong> Elle pesait {poidsLisible(reduction.avant)}, elle pèse maintenant {poidsLisible(reduction.apres)}. Ton site s'affichera plus vite.</span>
        </div>
      )}

      {(b.type === 'banniere' || b.type === 'image') && (
        <ChampImage img={b.image} label="Image" onChanger={() => changerImage(b.image, (image) => set({ image }))} onAlt={(alt) => set({ image: { ...b.image, alt } }, 'alt')} />
      )}

      {b.type === 'banniere' && (
        <>
          <Champ label="Slogan" valeur={b.slogan} lignes={2} onChange={(slogan) => set({ slogan }, 'slogan')} />
          <Champ label="Phrase sous le slogan" valeur={b.sous} onChange={(sous) => set({ sous }, 'sous')} />
          <Champ label="Texte du bouton" valeur={b.bouton} onChange={(bouton) => set({ bouton }, 'bouton')} />
          <ChoixPage valeur={b.cible} pages={pages} onChange={(cible) => set({ cible })} />
        </>
      )}

      {b.type === 'titre' && (
        <>
          <Champ label="Texte du titre" valeur={b.texte} aide="Court et clair. Exemple : « Nos valeurs »." onChange={(texte) => set({ texte }, 'texte')} />
          <div className="o-champ-groupe" role="group" aria-labelledby={`taille-${b.id}`}>
            <span id={`taille-${b.id}`} className="o-libelle">Taille</span>
            <div className="o-segmente o-segmente-plein">
              <button className="o-segment o-segment-38" aria-pressed={b.grand} onClick={() => set({ grand: true })}>Grand titre</button>
              <button className="o-segment o-segment-38" aria-pressed={!b.grand} onClick={() => set({ grand: false })}>Sous-titre</button>
            </div>
          </div>
        </>
      )}

      {b.type === 'paragraphe' && (
        <Champ label="Texte" valeur={b.texte} lignes={7} aide="Astuce : 3 à 5 phrases suffisent." onChange={(texte) => set({ texte }, 'texte')} />
      )}

      {b.type === 'image' && (
        <Champ label="Légende" facultatif valeur={b.legende} placeholder="Une phrase sous l'image" onChange={(legende) => set({ legende }, 'legende')} />
      )}

      {b.type === 'liste' && (
        <div className="o-champ-groupe" role="group" aria-labelledby={`liste-${b.id}`}>
          <span id={`liste-${b.id}`} className="o-libelle">Éléments de la liste</span>
          {b.elements.map((el, j) => (
            <div key={j} className="o-ligne-boutons o-gap6">
              <input
                className="o-champ o-flex1"
                value={el}
                aria-label={`Élément ${j + 1} de la liste`}
                onChange={(e) => { const elements = [...b.elements]; elements[j] = e.target.value; set({ elements }, `el-${j}`); }}
              />
              <button className="o-btn-icone o-btn-icone-44 o-btn-discret" aria-label={`Retirer l'élément ${j + 1}`} onClick={() => set({ elements: b.elements.filter((_, k) => k !== j) })}><Icon n="close" /></button>
            </div>
          ))}
          <button className="o-btn o-btn-pointille" onClick={() => set({ elements: [...b.elements, 'Nouveau point'] })}>+ Ajouter un élément</button>
        </div>
      )}

      {b.type === 'bouton' && (
        <>
          <Champ label="Texte du bouton" valeur={b.texte} aide="Commence par un verbe. Exemple : « Voir nos produits »." onChange={(texte) => set({ texte }, 'texte')} />
          <ChoixPage valeur={b.cible} pages={pages} onChange={(cible) => set({ cible })} />
        </>
      )}

      {b.type === 'produits' && (
        <div className="o-champ-groupe o-gap10" role="group" aria-labelledby={`prod-${b.id}`}>
          <span id={`prod-${b.id}`} className="o-libelle">Produits <span className="o-facultatif">· {b.produits.length}</span></span>
          {b.produits.map((x, j) => {
            const majP = (champs: Partial<typeof x>, cle?: string) =>
              set({ produits: b.produits.map((y, k) => (k === j ? { ...y, ...champs } : y)) }, cle && `p${j}-${cle}`);
            return (
              <fieldset key={x.id} className="o-fiche">
                <legend className="o-fiche-titre">
                  <span>Produit {j + 1}</span>
                  <span className="o-ligne-boutons o-gap6">
                    <button className="o-btn-icone" aria-label={`Monter le produit ${j + 1}`} title="Monter" disabled={j === 0}
                      onClick={() => { const p = [...b.produits]; [p[j - 1], p[j]] = [p[j], p[j - 1]]; set({ produits: p }); }}><Icon n="arrow_upward" size={20} /></button>
                    <button className="o-btn-icone o-btn-icone-danger" aria-label={`Retirer le produit ${j + 1}`} title="Retirer ce produit" disabled={b.produits.length <= 1}
                      onClick={() => set({ produits: b.produits.filter((_, k) => k !== j) })}><Icon n="delete" size={20} /></button>
                  </span>
                </legend>
                <Champ label="Nom du produit" valeur={x.nom} onChange={(nom) => majP({ nom }, 'nom')} />
                <Champ label="Description" valeur={x.desc} lignes={2} aide="Une phrase courte suffit." onChange={(desc) => majP({ desc }, 'desc')} />
                <Champ label="Prix" valeur={x.prix} aide="Exemple : « 12 € ». Les prix sont fictifs." onChange={(prix) => majP({ prix }, 'prix')} />
                {x.declinaisons?.length ? (
                  <ReglagesDeclinaisons produit={x} majP={majP} changerImage={changerImage} />
                ) : (
                  <>
                    <ChampImage
                      img={x.image}
                      label="Photo du produit"
                      onChanger={() => changerImage(x.image, (image) => majP({ image }))}
                      onAlt={(alt) => majP({ image: { ...x.image, alt } }, 'alt')}
                    />
                    <button
                      className="o-btn o-btn-pointille"
                      onClick={() => majP({ declinaisons: [nouvelleDeclinaison(1, x.image), nouvelleDeclinaison(2)] })}
                    >
                      + Ajouter des déclinaisons (couleurs, modèles…)
                    </button>
                    <span className="o-aide">Par exemple le même tee-shirt en rouge, bleu et vert, chacun avec sa photo.</span>
                  </>
                )}
              </fieldset>
            );
          })}
          <button className="o-btn o-btn-pointille" onClick={() => set({ produits: [...b.produits, nouveauProduit(b.produits.length + 1)] })}>+ Ajouter un produit</button>
        </div>
      )}

      {b.type === 'galerie' && (
        <>
          <div className="o-champ-groupe" role="group" aria-labelledby={`nb-${b.id}`}>
            <span id={`nb-${b.id}`} className="o-libelle">Nombre d'images</span>
            <div className="o-segmente o-segmente-plein">
              {([2, 3, 4] as const).map((n) => (
                <button key={n} className="o-segment o-segment-38" aria-pressed={b.n === n} onClick={() => set({ n })}>{n}</button>
              ))}
            </div>
          </div>
          {b.images.slice(0, b.n).map((im, j) => (
            <ChampImage
              key={j}
              img={im}
              label={`Image ${j + 1}`}
              onChanger={() => changerImage(im, (nv) => { const images = [...b.images]; images[j] = nv; set({ images }); })}
              onAlt={(alt) => { const images = [...b.images]; images[j] = { ...im, alt }; set({ images }, `alt-${j}`); }}
            />
          ))}
        </>
      )}

      {b.type === 'cartes' && (
        <div className="o-champ-groupe o-gap10" role="group" aria-labelledby={`cartes-${b.id}`}>
          <span className="o-libelle">En haut de chaque carte</span>
          <div className="o-segmente o-segmente-plein">
            <button className="o-segment o-segment-38" aria-pressed={b.style === 'icone'} onClick={() => set({ style: 'icone' })}>Une icône</button>
            <button className="o-segment o-segment-38" aria-pressed={b.style === 'image'} onClick={() => set({ style: 'image' })}>Une image</button>
          </div>
          <span id={`cartes-${b.id}`} className="o-libelle o-mt4">Cartes <span className="o-facultatif">· {b.cartes.length}</span></span>
          {b.cartes.map((k, j) => {
            const majC = (champs: Partial<typeof k>, cle?: string) =>
              set({ cartes: b.cartes.map((y, n) => (n === j ? { ...y, ...champs } : y)) }, cle && `c${j}-${cle}`);
            return (
              <fieldset key={k.id} className="o-fiche">
                <legend className="o-fiche-titre">
                  <span>Carte {j + 1}</span>
                  <span className="o-ligne-boutons o-gap6">
                    <button className="o-btn-icone" aria-label={`Monter la carte ${j + 1}`} title="Monter" disabled={j === 0}
                      onClick={() => { const c2 = [...b.cartes]; [c2[j - 1], c2[j]] = [c2[j], c2[j - 1]]; set({ cartes: c2 }); }}><Icon n="arrow_upward" size={20} /></button>
                    <button className="o-btn-icone o-btn-icone-danger" aria-label={`Retirer la carte ${j + 1}`} title="Retirer cette carte" disabled={b.cartes.length <= 1}
                      onClick={() => set({ cartes: b.cartes.filter((_, n) => n !== j) })}><Icon n="delete" size={20} /></button>
                  </span>
                </legend>
                {b.style === 'icone' ? (
                  <label className="o-champ-groupe">
                    <span className="o-libelle">Icône</span>
                    <span className="o-ligne-boutons o-gap8 o-nowrap">
                      <span className="o-apercu-icone"><Icon n={k.icone} /></span>
                      <select className="o-champ o-flex1" value={k.icone} onChange={(e) => majC({ icone: e.target.value })}>
                        {Object.entries(ICONES_CARTES).map(([n, nom]) => <option key={n} value={n}>{nom}</option>)}
                      </select>
                    </span>
                  </label>
                ) : (
                  <ChampImage img={k.image} label="Image" onChanger={() => changerImage(k.image, (image) => majC({ image }))} onAlt={(alt) => majC({ image: { ...k.image, alt } }, 'alt')} />
                )}
                <Champ label="Titre" valeur={k.titre} onChange={(titre) => majC({ titre }, 'titre')} />
                <Champ label="Texte" valeur={k.texte} lignes={2} onChange={(texte) => majC({ texte }, 'texte')} />
                <ChoixPage valeur={k.cible} pages={pages} facultatif onChange={(cible) => majC({ cible: cible || null })} />
              </fieldset>
            );
          })}
          {b.cartes.length < 6 && (
            <button className="o-btn o-btn-pointille" onClick={() => set({ cartes: [...b.cartes, nouvelleCarte(b.cartes.length + 1)] })}>+ Ajouter une carte</button>
          )}
        </div>
      )}

      {b.type === 'horaires' && (
        <>
          <Champ label="Adresse" valeur={b.adresse} lignes={2} aide="Une adresse inventée, par exemple « 12 rue des Lilas, 69003 Lyon »." onChange={(adresse) => set({ adresse }, 'adresse')} />
          <Champ label="Comment venir" facultatif valeur={b.acces} placeholder="Bus 12, arrêt Mairie" onChange={(acces) => set({ acces }, 'acces')} />
          <div className="o-champ-groupe" role="group" aria-labelledby={`h-${b.id}`}>
            <span id={`h-${b.id}`} className="o-libelle">Horaires</span>
            {b.horaires.map((h, j) => (
              <div key={j} className="o-ligne-boutons o-gap6 o-nowrap">
                <input className="o-champ o-flex1" value={h.jour} aria-label={`Jours, ligne ${j + 1}`} placeholder="Jours"
                  onChange={(e) => set({ horaires: b.horaires.map((x, n) => (n === j ? { ...x, jour: e.target.value } : x)) }, `hj${j}`)} />
                <input className="o-champ o-champ-heures" value={h.heures} aria-label={`Heures, ligne ${j + 1}`} placeholder="9 h – 19 h"
                  onChange={(e) => set({ horaires: b.horaires.map((x, n) => (n === j ? { ...x, heures: e.target.value } : x)) }, `hh${j}`)} />
                <button className="o-btn-icone o-btn-discret" aria-label={`Retirer la ligne ${j + 1}`} onClick={() => set({ horaires: b.horaires.filter((_, n) => n !== j) })}><Icon n="close" /></button>
              </div>
            ))}
            <button className="o-btn o-btn-pointille" onClick={() => set({ horaires: [...b.horaires, { jour: '', heures: '' }] })}>+ Ajouter une ligne</button>
          </div>
        </>
      )}

      {b.type === 'formulaire' && (
        <>
          <Champ label="Titre du formulaire" valeur={b.titre} onChange={(titre) => set({ titre }, 'titre')} />
          <Champ label="Texte du bouton" valeur={b.bouton} onChange={(bouton) => set({ bouton }, 'bouton')} />
          <div className="o-msg o-msg-info"><Icon n="info" /><span>C'est un formulaire d'exemple : sur le site, aucun message n'est vraiment envoyé. Une phrase le précise sous le bouton.</span></div>
        </>
      )}

      {b.type === 'citation' && (
        <>
          <Champ label="Citation" valeur={b.texte} lignes={3} aide="Une phrase courte, par exemple l'avis d'un client imaginaire." onChange={(texte) => set({ texte }, 'texte')} />
          <Champ label="Auteur" facultatif valeur={b.auteur} placeholder="Léa, cliente fidèle" onChange={(auteur) => set({ auteur }, 'auteur')} />
        </>
      )}

      {b.type === 'separateur' && (
        <div className="o-champ-groupe" role="group" aria-labelledby={`sep-${b.id}`}>
          <span id={`sep-${b.id}`} className="o-libelle">Apparence</span>
          <div className="o-segmente o-segmente-plein">
            <button className="o-segment o-segment-38" aria-pressed={b.style === 'ligne'} onClick={() => set({ style: 'ligne' })}>Une ligne</button>
            <button className="o-segment o-segment-38" aria-pressed={b.style === 'espace'} onClick={() => set({ style: 'espace' })}>Un espace</button>
          </div>
        </div>
      )}

      {TYPES_AVEC_COULEUR.includes(b.type) && <ChoixCouleurTexte b={b} parent={parent} set={set} />}

      <div className="o-champ-groupe o-gap8" role="group" aria-labelledby={`fond-${b.id}`}>
        <span id={`fond-${b.id}`} className="o-libelle">Fond du bloc <span className="o-facultatif">· couleurs de ta charte</span></span>
        <div className="o-colonne o-gap6">
          {fonds.map((f) => (
            <button key={f.k} className="o-carte-choix o-fond" aria-pressed={b.fond === f.k} onClick={() => set({ fond: f.k })}>
              <span className="o-fond-pastille" style={{ background: f.couleur }} />{f.label}
            </button>
          ))}
        </div>
      </div>

      <button className="o-btn o-btn-danger o-mt-auto" onClick={supprimer}><Icon n="delete" />{parent ? 'Retirer de la colonne' : 'Supprimer ce bloc'}</button>
    </>
  );
}

/** Couleur du texte d'un bloc : celle de la charte par défaut, ou une autre si besoin. */
function ChoixCouleurTexte({ b, parent, set }: { b: Bloc; parent: BlocColonnes | null; set: (champs: Partial<Bloc>) => void }) {
  const { projet } = useProjet();
  const pal = paletteDe(projet.charte);
  // Fond réel derrière le texte : celui du bloc, sinon celui des colonnes, sinon la page.
  const fond = (f: Fond) => (f === 'douce' ? pal.surface : f === 'principale' ? projet.charte.principale : null);
  const derriere = fond(b.fond) ?? (parent && fond(parent.fond)) ?? pal.fond;
  const pastilles = [...new Set([pal.texte, projet.charte.principale, projet.charte.accent, '#FFFFFF', '#111111'].map((c) => c.toUpperCase()))];
  const actuelle = b.couleur ?? null;
  const faible = !!actuelle && contraste(actuelle, derriere) < 4.5;
  return (
    <div className="o-champ-groupe o-gap8" role="group" aria-labelledby={`coul-${b.id}`}>
      <span id={`coul-${b.id}`} className="o-libelle">Couleur du texte</span>
      <button className="o-carte-choix o-fond" aria-pressed={!actuelle} onClick={() => set({ couleur: undefined })}>
        <span className="o-fond-pastille" style={{ background: pal.texte }} />Celle de ma charte
      </button>
      <div className="o-pastilles">
        {pastilles.map((c) => (
          <button key={c} className="o-pastille o-pastille-32" aria-label={`Texte en ${c}`} aria-pressed={actuelle?.toUpperCase() === c} style={{ background: c }} onClick={() => set({ couleur: c })} />
        ))}
        <label className="o-autre-couleur">
          <input type="color" value={actuelle ?? pal.texte} aria-label="Autre couleur de texte" onChange={(e) => set({ couleur: e.target.value.toUpperCase() })} />
          Autre
        </label>
      </div>
      {faible ? (
        <div role="alert" className="o-msg o-msg-alerte">
          <Icon n="warning" size={24} />
          <div className="o-msg-corps">
            <strong>Ce texte se lit mal sur ce fond.</strong>
            <span>Choisis une couleur plus foncée sur un fond clair, ou plus claire sur un fond foncé.</span>
            <button className="o-btn o-btn-contour-alerte" onClick={() => set({ couleur: undefined })}>Reprendre la couleur de ma charte</button>
          </div>
        </div>
      ) : actuelle && <span className="o-ok"><Icon n="check_circle" />Ce texte est bien lisible sur ce fond.</span>}
    </div>
  );
}

/** Déclinaisons d'un produit : nom, couleur de la pastille (ou aucune), photo et description. */
function ReglagesDeclinaisons({ produit, majP, changerImage }: {
  produit: Produit;
  majP: (champs: Partial<Produit>, cle?: string) => void;
  changerImage: (actuelle: Img, appliquer: (i: Img) => void) => void;
}) {
  const decl = produit.declinaisons ?? [];
  const maj = (j: number, champs: Partial<Declinaison>, cle?: string) =>
    majP({ declinaisons: decl.map((d, k) => (k === j ? { ...d, ...champs } : d)) }, cle && `d${j}-${cle}`);
  const retirer = (j: number) => {
    const reste = decl.filter((_, k) => k !== j);
    // Il faut au moins 2 déclinaisons ; avec une seule, le produit redevient simple (sa photo est gardée).
    if (reste.length < 2) majP({ declinaisons: undefined, image: reste[0]?.image ?? produit.image });
    else majP({ declinaisons: reste });
  };
  return (
    <div className="o-champ-groupe o-gap8" role="group" aria-label={`Déclinaisons de ${produit.nom}`}>
      <span className="o-libelle">Déclinaisons <span className="o-facultatif">· {decl.length}</span></span>
      <span className="o-aide">Sur le site, une pastille par déclinaison : un clic change la photo.</span>
      {decl.map((d, j) => (
        <div key={d.id} className="o-sous-fiche">
          <div className="o-sous-fiche-titre">
            <span className={`o-pastille-decl${d.couleur ? '' : ' sans'}`} style={d.couleur ? { background: d.couleur } : undefined} aria-hidden="true" />
            <strong className="o-flex1">{d.nom || `Déclinaison ${j + 1}`}</strong>
            <button className="o-btn-icone" aria-label={`Monter la déclinaison ${d.nom}`} title="Monter" disabled={j === 0}
              onClick={() => { const a = [...decl]; [a[j - 1], a[j]] = [a[j], a[j - 1]]; majP({ declinaisons: a }); }}><Icon n="arrow_upward" size={20} /></button>
            <button className="o-btn-icone o-btn-icone-danger" aria-label={`Retirer la déclinaison ${d.nom}`} title="Retirer" onClick={() => retirer(j)}><Icon n="delete" size={20} /></button>
          </div>
          <Champ label="Nom" valeur={d.nom} placeholder="Rouge, Modèle XL…" onChange={(nom) => maj(j, { nom }, 'nom')} />
          <div className="o-champ-groupe">
            <span className="o-libelle">Pastille</span>
            <div className="o-pastilles">
              {COULEURS_DECLINAISONS.map((hex) => (
                <button key={hex} className="o-pastille o-pastille-28" aria-label={`Pastille ${hex}`} aria-pressed={d.couleur?.toUpperCase() === hex} style={{ background: hex }} onClick={() => maj(j, { couleur: hex })} />
              ))}
              <label className="o-autre-couleur">
                <input type="color" value={d.couleur ?? '#888888'} aria-label="Autre couleur de pastille" onChange={(e) => maj(j, { couleur: e.target.value.toUpperCase() }, 'couleur')} />
                Autre
              </label>
              <button className="o-btn o-btn-secondaire o-btn-40 o-bascule" aria-pressed={!d.couleur} onClick={() => maj(j, { couleur: null })} title="La pastille affiche le nom au lieu d'une couleur">Texte</button>
            </div>
          </div>
          <ChampImage
            img={d.image}
            label="Photo"
            onChanger={() => changerImage(d.image, (image) => maj(j, { image }))}
            onAlt={(alt) => maj(j, { image: { ...d.image, alt } }, 'alt')}
          />
        </div>
      ))}
      {decl.length < MAX_DECLINAISONS && (
        <button className="o-btn o-btn-pointille" onClick={() => majP({ declinaisons: [...decl, nouvelleDeclinaison(decl.length + 1)] })}>+ Ajouter une déclinaison</button>
      )}
    </div>
  );
}

function Champ({ label, valeur, onChange, aide, lignes, facultatif, placeholder }: {
  label: string; valeur: string; onChange: (v: string) => void; aide?: string; lignes?: number; facultatif?: boolean; placeholder?: string;
}) {
  return (
    <label className="o-champ-groupe">
      <span className="o-libelle">{label}{facultatif && <span className="o-facultatif"> (facultatif)</span>}</span>
      {lignes
        ? <textarea className="o-champ o-zone" rows={lignes} value={valeur} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className="o-champ" value={valeur} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
      {aide && <span className="o-aide">{aide}</span>}
    </label>
  );
}

function ChoixPage({ valeur, pages, onChange, facultatif }: { valeur: string | null; pages: Page[]; onChange: (id: string) => void; facultatif?: boolean }) {
  const existe = pages.some((p) => p.id === valeur);
  return (
    <label className="o-champ-groupe">
      <span className="o-libelle">Mène vers la page{facultatif && <span className="o-facultatif"> (facultatif)</span>}</span>
      <select className="o-champ" value={existe ? valeur! : ''} onChange={(e) => onChange(e.target.value)}>
        {facultatif
          ? <option value="">Aucun lien</option>
          : !existe && <option value="" disabled>Choisis une page</option>}
        {pages.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </select>
    </label>
  );
}

function ChampImage({ img, label, onChanger, onAlt }: { img: Img; label: string; onChanger: () => void; onAlt: (alt: string) => void }) {
  const manque = !img.alt.trim();
  const id = useRef(`alt-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div className="o-champ-groupe o-gap8">
      <span className="o-libelle">{label}</span>
      <div className="o-ligne-boutons o-gap10">
        {img.src
          ? <img className="o-vignette" src={img.src} alt="" />
          : <span className="o-vignette o-vignette-vide" />}
        <button className="o-btn o-btn-secondaire o-flex1" onClick={onChanger}><Icon n="upload" />{img.src ? "Changer l'image" : 'Choisir une image'}</button>
      </div>
      <label className="o-libelle o-mt4" htmlFor={id}>Description de l'image</label>
      <input
        id={id}
        className={`o-champ${manque ? ' en-erreur' : ''}`}
        value={img.alt}
        aria-invalid={manque || undefined}
        aria-describedby={`${id}-aide`}
        placeholder="Que voit-on sur l'image ?"
        onChange={(e) => onAlt(e.target.value)}
      />
      {manque
        ? <span id={`${id}-aide`} className="o-aide-erreur"><Icon n="error" size={20} />Écris ce qu'on voit : cette phrase est lue aux personnes qui ne voient pas l'image.</span>
        : <span id={`${id}-aide`} className="o-aide">Exemple : «&nbsp;Maquette en carton du magasin vue de face&nbsp;».</span>}
    </div>
  );
}
