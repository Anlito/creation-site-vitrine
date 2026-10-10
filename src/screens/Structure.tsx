// Onglet « Pages » : cocher les pages, les ranger dans l'ordre du menu, créer des sous-pages.
import { useState } from 'react';
import { Barre, BandeauMessage } from '../components/Barre';
import { Icon } from '../components/Icon';
import { blocsDuModele, modelesPour } from '../data/modeles';
import { useProjet } from '../etat';
import { arbrePages, menuSite, pagesActives, pageVisible, policesDe, sousPages, uid, type Page, type Projet } from '../model';
import { MarqueLogo } from '../site/Logo';

/** Pages du menu principal qui peuvent recevoir des sous-pages (pas l'accueil, pas une sous-page). */
const parentsPossibles = (p: Projet, saufId?: string) =>
  p.pages.filter((pg) => pg.id !== 'accueil' && !pg.parent && pg.id !== saufId);

export function Structure() {
  const { projet, maj, ui, setUi } = useProjet();
  const [nouvelle, setNouvelle] = useState('');
  const [place, setPlace] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const actives = pagesActives(projet);
  const n = actives.length;
  const manque = Math.max(0, 3 - n);
  const lignes = arbrePages(projet, false);

  const setPages = (f: (pages: Page[]) => Page[]) => maj((p) => ({ ...p, pages: f(p.pages) }));

  /** Échange une page avec sa voisine de même niveau (l'accueil reste en premier). */
  const deplacer = (id: string, d: number) => setPages((pages) => {
    const pg = pages.find((x) => x.id === id)!;
    const freres = pages.filter((x) => (x.parent ?? null) === (pg.parent ?? null) && x.id !== 'accueil');
    const i = freres.findIndex((x) => x.id === id);
    const voisin = freres[i + d];
    if (!voisin) return pages;
    const a = [...pages];
    const ia = a.findIndex((x) => x.id === id), ib = a.findIndex((x) => x.id === voisin.id);
    [a[ia], a[ib]] = [a[ib], a[ia]];
    return a;
  });

  const basculer = (id: string) => {
    setPages((pages) => pages.map((pg) => (pg.id === id && !pg.verrouillee ? { ...pg, active: !pg.active } : pg)));
    if (ui.pageId === id) setUi({ pageId: 'accueil', sel: null });
  };

  const changerPlace = (id: string, parent: string) => setPages((pages) => {
    const reste = pages.filter((x) => x.id !== id);
    const pg = { ...pages.find((x) => x.id === id)!, parent: parent || undefined };
    // Rangée à la fin de son nouveau groupe.
    return [...reste, pg];
  });

  const ajouter = (e: React.FormEvent) => {
    e.preventDefault();
    const nom = nouvelle.trim();
    if (!nom) { setErreur('Écris le nom de la page à ajouter.'); return; }
    if (projet.pages.some((pg) => pg.nom.toLowerCase() === nom.toLowerCase())) { setErreur(`La page « ${nom} » existe déjà.`); return; }
    const parent = place || undefined;
    setPages((pages) => [...pages, { id: uid(), nom, desc: parent ? 'Une sous-page ajoutée par ton équipe' : 'Une page ajoutée par ton équipe', active: true, perso: true, parent, blocs: [] }]);
    setNouvelle('');
    setErreur(null);
  };

  // Une page supprimée libère ses sous-pages, qui remontent dans le menu principal.
  const supprimer = (id: string) => setPages((pages) => pages.filter((pg) => pg.id !== id).map((pg) => (pg.parent === id ? { ...pg, parent: undefined } : pg)));

  // Pages cochées sans contenu : on leur donne le premier modèle conseillé.
  const vides = actives.filter((pg) => pg.blocs.length === 0);
  const remplirVides = () => maj((p) => ({
    ...p,
    pages: p.pages.map((pg) => {
      if (!pageVisible(p, pg) || pg.blocs.length) return pg;
      const { conseilles, generaux } = modelesPour(pg.id);
      return { ...pg, blocs: blocsDuModele(conseilles[0] ?? generaux[0], p) };
    }),
  }));

  return (
    <div className="o-ecran">
      <Barre />
      <BandeauMessage />
      <div className="o-structure">
        <div className="o-structure-col">
          <div className="o-structure-entete">
            <div className="o-entete-panneau">
              <h1 className="o-t28">Les pages de ton site</h1>
              <p className="o-aide">Coche les pages, range-les dans l'ordre du menu, et place certaines pages dans un sous-menu.</p>
            </div>
            <span role="status" className={`o-pastille-compte ${manque ? 'mauvais' : 'bon'}`}>
              <Icon n={manque ? 'error' : 'check_circle'} />{n} page{n > 1 ? 's' : ''} · minimum 3
            </span>
          </div>
          {manque > 0 && (
            <div role="alert" className="o-msg o-msg-erreur o-msg-ligne">
              <Icon n="error" size={24} />
              {manque === 1 ? 'Il te manque 1 page. Coche encore une page.' : `Il te manque ${manque} pages. Coche encore ${manque} pages.`}
            </div>
          )}
          <ul className="o-liste-pages">
            {lignes.map(({ page: pg, niveau }) => {
              const freres = projet.pages.filter((x) => (x.parent ?? null) === (pg.parent ?? null) && x.id !== 'accueil');
              const rang = freres.findIndex((x) => x.id === pg.id);
              const aDesEnfants = sousPages(projet, pg.id).length > 0;
              const parentDecoche = niveau === 1 && pg.active && !pageVisible(projet, pg);
              return (
                <li key={pg.id} className={`o-ligne-page${niveau ? ' sous-page' : ''}${parentDecoche ? ' masquee' : ''}`}>
                  {niveau === 1 && <Icon n="subdirectory_arrow_right" className="o-c-discret" />}
                  <label className="o-ligne-page-case">
                    <input type="checkbox" className="o-case" checked={pg.active} disabled={pg.verrouillee} onChange={() => basculer(pg.id)} />
                    <span className="o-case-dessin" aria-hidden="true"><Icon n="check" size={20} /></span>
                    <span className="o-ligne-page-nom">{pg.nom}</span>
                  </label>
                  <span className="o-ligne-page-desc">
                    {parentDecoche ? 'Cachée : sa page parente est décochée.' : pg.desc}
                  </span>
                  {pg.verrouillee ? (
                    <span className="o-toujours"><Icon n="lock" size={20} />Toujours présente</span>
                  ) : (
                    <>
                      <select
                        className="o-champ o-select-place"
                        value={pg.parent ?? ''}
                        aria-label={`Place de la page ${pg.nom} dans le menu`}
                        disabled={aDesEnfants}
                        title={aDesEnfants ? 'Cette page a déjà des sous-pages : elle reste dans le menu principal.' : undefined}
                        onChange={(e) => changerPlace(pg.id, e.target.value)}
                      >
                        <option value="">Menu principal</option>
                        {parentsPossibles(projet, pg.id).map((x) => <option key={x.id} value={x.id}>Sous «&nbsp;{x.nom}&nbsp;»</option>)}
                      </select>
                      <span className="o-ligne-page-actions">
                        <button className="o-btn-icone" aria-label={`Monter la page ${pg.nom}`} title="Monter" disabled={rang <= 0} onClick={() => deplacer(pg.id, -1)}><Icon n="arrow_upward" size={20} /></button>
                        <button className="o-btn-icone" aria-label={`Descendre la page ${pg.nom}`} title="Descendre" disabled={rang === freres.length - 1} onClick={() => deplacer(pg.id, 1)}><Icon n="arrow_downward" size={20} /></button>
                        {pg.perso && (
                          <button className="o-btn-icone o-btn-icone-danger" aria-label={`Supprimer la page ${pg.nom}`} title="Supprimer cette page" onClick={() => supprimer(pg.id)}>
                            <Icon n="delete" size={20} />
                          </button>
                        )}
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          {vides.length > 0 && (
            <div className="o-msg o-msg-info o-msg-ligne">
              <Icon n="view_quilt" />
              <span className="o-flex1">{vides.length === 1 ? 'Une page cochée est vide.' : `${vides.length} pages cochées sont vides.`} Tu peux partir d'un modèle tout prêt pour chacune.</span>
              <button className="o-btn o-btn-secondaire" onClick={remplirVides}>Remplir avec des modèles</button>
            </div>
          )}
          <form className="o-ajout-page" onSubmit={ajouter}>
            <label htmlFor="nouvelle-page" className="o-libelle o-t17">Ajouter une page à toi</label>
            <div className="o-ligne-boutons o-nowrap">
              <input
                id="nouvelle-page"
                className={`o-champ o-champ-46 o-flex1${erreur ? ' en-erreur' : ''}`}
                placeholder="Exemple : Le magasin en 3D"
                value={nouvelle}
                maxLength={30}
                aria-invalid={!!erreur || undefined}
                onChange={(e) => { setNouvelle(e.target.value); setErreur(null); }}
              />
              <select className="o-champ o-champ-46 o-select-place" value={place} aria-label="Où ranger la nouvelle page" onChange={(e) => setPlace(e.target.value)}>
                <option value="">Dans le menu principal</option>
                {parentsPossibles(projet).map((x) => <option key={x.id} value={x.id}>Sous-page de «&nbsp;{x.nom}&nbsp;»</option>)}
              </select>
              <button type="submit" className="o-btn o-btn-secondaire o-btn-46"><Icon n="add" />Ajouter</button>
            </div>
            {erreur && <span className="o-aide-erreur"><Icon n="error" size={20} />{erreur}</span>}
          </form>
        </div>
        <ApercuMenu />
      </div>
    </div>
  );
}

function ApercuMenu() {
  const { projet } = useProjet();
  const menu = menuSite(projet);
  const pol = policesDe(projet.charte);
  return (
    <div className="o-apercu-menu" aria-label="Aperçu du menu">
      <span className="o-t17 o-gras">Aperçu du menu</span>
      <span className="o-aide">Sur ordinateur : les sous-pages s'ouvrent au survol</span>
      <div className="o-menu-ordi" style={{ fontFamily: pol.texte }}>
        <MarqueLogo p={projet} taille={30} icone={18} />
        <span className="o-menu-ordi-liens">
          {menu.map(({ page: pg, enfants }) => (
            <span key={pg.id} className="o-menu-ordi-item">
              {pg.nom}{enfants.length > 0 && <Icon n="expand_more" size={18} />}
              {enfants.length > 0 && <span className="o-menu-ordi-sous">{enfants.map((e) => <span key={e.id}>{e.nom}</span>)}</span>}
            </span>
          ))}
        </span>
      </div>
      <span className="o-aide o-mt6">Sur téléphone, le menu se replie dans un bouton</span>
      <div className="o-menu-tel" style={{ fontFamily: pol.texte }}>
        <div className="o-menu-tel-entete">
          <MarqueLogo p={projet} taille={26} icone={16} />
          <span className="o-menu-tel-fermer"><Icon n="close" size={20} />Fermer</span>
        </div>
        {menu.map(({ page: pg, enfants }) => (
          <span key={pg.id}>
            <span className="o-menu-tel-ligne">{pg.nom}</span>
            {enfants.map((e) => <span key={e.id} className="o-menu-tel-ligne o-menu-tel-sous">↳ {e.nom}</span>)}
          </span>
        ))}
      </div>
    </div>
  );
}
