// Panneau « Modèles » de l'éditeur : des pages toutes prêtes à compléter.
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { typeBloc } from '../data/constantes';
import { blocsDuModele, modelesPour, type Modele } from '../data/modeles';
import { useProjet } from '../etat';
import { colonnesVisibles, type Bloc, type Page } from '../model';

/** Petit schéma de la page : une case par bloc, rangées comme sur le site. */
export function SchemaPage({ blocs }: { blocs: Bloc[] }) {
  return (
    <span className="o-schema-page" aria-hidden="true">
      {blocs.map((l) => (
        <span key={l.id} className="o-schema-ligne">
          {(l.type === 'colonnes' ? colonnesVisibles(l).flat() : [l]).map((b) => (
            <span key={b.id} className={`o-schema-bloc o-schema-${b.type}`} title={typeBloc(b.type).label}>
              <Icon n={typeBloc(b.type).icon} size={14} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function CarteModele({ m, page, appliquer }: { m: Modele; page: Page; appliquer: (blocs: Bloc[], remplacer: boolean) => void }) {
  const { projet } = useProjet();
  const [choix, setChoix] = useState(false);
  const blocs = useMemo(() => blocsDuModele(m, projet), [m, projet]);
  const utiliser = (remplacer: boolean) => { appliquer(blocsDuModele(m, projet), remplacer); setChoix(false); };
  return (
    <div className={`o-modele${choix ? ' ouvert' : ''}`}>
      <button className="o-modele-bouton" aria-expanded={page.blocs.length > 0 ? choix : undefined} onClick={() => (page.blocs.length ? setChoix(!choix) : utiliser(true))}>
        <SchemaPage blocs={blocs} />
        <span className="o-modele-texte">
          <strong>{m.nom}</strong>
          <span>{m.desc}</span>
        </span>
      </button>
      {choix && (
        <div className="o-modele-choix" role="group" aria-label={`Utiliser le modèle ${m.nom}`}>
          <span className="o-aide">Ta page contient déjà {page.blocs.length} bloc{page.blocs.length > 1 ? 's' : ''}.</span>
          <button className="o-btn o-btn-secondaire" onClick={() => utiliser(false)}><Icon n="add" />Ajouter à la suite</button>
          <button className="o-btn o-btn-danger" onClick={() => utiliser(true)}><Icon n="sync" />Remplacer ma page</button>
          <span className="o-aide">Tu pourras revenir en arrière avec « Annuler ».</span>
        </div>
      )}
    </div>
  );
}

export function PanneauModeles({ page, appliquer }: { page: Page; appliquer: (blocs: Bloc[], remplacer: boolean) => void }) {
  const { conseilles, generaux } = modelesPour(page.id);
  return (
    <>
      <div className="o-entete-panneau">
        <h2 className="o-t19">Modèles de page</h2>
        <p className="o-aide">Choisis une mise en page toute prête, puis remplace les textes et les images par les tiens.</p>
      </div>
      {conseilles.length > 0 && (
        <div className="o-section-8">
          <span className="o-libelle">Conseillés pour «&nbsp;{page.nom}&nbsp;»</span>
          {conseilles.map((m) => <CarteModele key={m.id} m={m} page={page} appliquer={appliquer} />)}
        </div>
      )}
      <div className="o-section-8">
        <span className="o-libelle">Pour toutes les pages</span>
        {generaux.map((m) => <CarteModele key={m.id} m={m} page={page} appliquer={appliquer} />)}
      </div>
    </>
  );
}
