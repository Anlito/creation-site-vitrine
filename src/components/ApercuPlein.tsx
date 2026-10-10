// Aperçu du site en plein écran, tel que les visiteurs le verront (liens du menu actifs).
import { useEffect, useRef, useState } from 'react';
import { useProjet } from '../etat';
import { nomDansListe, pagesActives } from '../model';
import { PageSite } from '../site/Site';
import { Icon } from './Icon';

export function ApercuPlein() {
  const { projet, ui, setUi } = useProjet();
  const pages = pagesActives(projet);
  const [pageId, setPageId] = useState(() => (pages.some((p) => p.id === ui.pageId) ? ui.pageId : pages[0]?.id));
  const [appareil, setAppareil] = useState(ui.appareil);
  const fermer = useRef<HTMLButtonElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const page = pages.find((p) => p.id === pageId) ?? pages[0];

  const quitter = () => setUi({ apercu: false });

  useEffect(() => {
    fermer.current?.focus();
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') quitter(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  const aller = (id: string) => {
    setPageId(id);
    zone.current?.querySelectorAll('details[open]').forEach((d) => d.removeAttribute('open'));
    zone.current?.scrollTo(0, 0);
  };

  // Les liens du site mènent vers « #idDeLaPage » : on change de page sans quitter l'aperçu.
  const clic = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href')?.slice(1);
    if (id && pages.some((p) => p.id === id)) aller(id);
  };

  if (!page) return null;
  return (
    <div className="o-apercu-plein" role="dialog" aria-modal="true" aria-label="Aperçu de ton site">
      <div className="o-apercu-plein-barre">
        <span className="o-apercu-plein-titre"><Icon n="visibility" className="o-c-action" />Aperçu de ton site</span>
        <label className="o-apercu-plein-page">
          <span className="o-c-2">Page :</span>
          <select className="o-champ" value={page.id} onChange={(e) => aller(e.target.value)}>
            {pages.map((p) => <option key={p.id} value={p.id}>{nomDansListe(projet, p)}</option>)}
          </select>
        </label>
        <div role="group" aria-label="Appareil" className="o-segmente">
          {([['ordinateur', 'Ordinateur', 'computer'], ['telephone', 'Téléphone', 'smartphone']] as const).map(([k, label, icon]) => (
            <button key={k} className="o-segment" aria-pressed={appareil === k} onClick={() => setAppareil(k)}>
              <Icon n={icon} size={20} />{label}
            </button>
          ))}
        </div>
        <button ref={fermer} className="o-btn o-btn-secondaire o-ml-auto" onClick={quitter}><Icon n="close_fullscreen" />Fermer l'aperçu</button>
      </div>
      <div ref={zone} className={`o-apercu-plein-zone ${appareil}`} onClick={clic}>
        <div className={appareil === 'telephone' ? 'o-apercu-plein-tel' : 'o-apercu-plein-ordi'}>
          <PageSite c={{ p: projet, page, outil: false, lien: (id) => (id ? `#${id}` : undefined) }} />
        </div>
      </div>
    </div>
  );
}
