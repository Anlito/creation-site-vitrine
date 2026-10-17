// Étape 5 — Contrôle et export : ce qui manque d'abord, en rouge, avec un bouton pour y aller.
import { useState } from 'react';
import { Barre, BandeauMessage, useEnregistrer } from '../components/Barre';
import { Icon } from '../components/Icon';
import { dossierConseille } from '../data/constantes';
import { useProjet } from '../etat';
import { fichierProjetConnu, peutChoisirDossier } from '../lib/fichier';
import { verifier, type Cible } from '../lib/controle';
import { exporterSite } from '../lib/export';

export function Controle() {
  const { projet, allerEtape, setUi, setMessage } = useProjet();
  const enregistrer = useEnregistrer();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);
  const verifs = verifier(projet);
  const rates = verifs.filter((v) => !v.ok);
  const reussis = verifs.length - rates.length;

  const aller = (c?: Cible) => {
    if (!c) return;
    if (c.etape === 2) setUi({ ongletCharte: c.onglet ?? 'couleurs' });
    if (c.etape === 4) setUi({ pageId: c.pageId ?? 'accueil', sel: c.blocId ?? null, panneau: 'bloc' });
    allerEtape(c.etape);
  };

  const exporter = async () => {
    setEnCours(true);
    setErreur(false);
    try {
      const nom = await exporterSite(projet);
      setMessage({ type: 'exporte', fichier: nom });
    } catch (e) {
      console.error(e);
      setErreur(true);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="o-ecran">
      <Barre />
      <BandeauMessage />
      <div className="o-controle">
        <div className="o-carte-blanche o-controle-liste">
          <div className="o-controle-entete">
            <div className="o-entete-panneau">
              <h1 className="o-t28">Vérifie ton site</h1>
              {rates.length
                ? <p className="o-rouge-gras">{rates.length === 1 ? 'Il reste 1 chose à corriger.' : `Il reste ${rates.length} choses à corriger.`}</p>
                : <p className="o-vert-gras">Tout est prêt. Bravo !</p>}
            </div>
            <div className="o-controle-score">
              <span className="o-c-2">{reussis} sur {verifs.length} vérifications réussies</span>
              <div className="o-segments" aria-hidden="true">
                {verifs.map((v, i) => <span key={v.id} className={i < reussis ? 'ok' : 'ko'} />)}
              </div>
            </div>
          </div>
          <ul className="o-verifs">
            {rates.map((v) => (
              <li key={v.id} className="o-verif o-verif-ko">
                <Icon n="cancel" size={26} />
                <div className="o-verif-texte"><strong>{v.t}</strong><span>{v.detail}</span></div>
                <button className="o-btn o-btn-contour o-btn-40" onClick={() => aller(v.cible)}>{v.action}</button>
              </li>
            ))}
            {verifs.filter((v) => v.ok).map((v) => (
              <li key={v.id} className="o-verif o-verif-ok">
                <Icon n="check_circle" size={26} />
                <span>{v.t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="o-colonne o-gap16">
          <div className="o-carte-blanche o-carte-action" data-aide="enregistrer-carte">
            <h2 className="o-t20"><Icon n="save" size={26} className="o-c-action" />Pour continuer plus tard</h2>
            <p className="o-aide o-lh145">Garde ton travail dans ton dossier : <strong className="o-c-texte">{dossierConseille(projet.meta.classe, projet.meta.equipe)}</strong>. Tu le rouvriras à la prochaine séance.</p>
            <button className="o-btn o-btn-secondaire o-btn-50" onClick={() => enregistrer()}>Enregistrer mon projet</button>
            {peutChoisirDossier() && fichierProjetConnu() && (
              <button className="o-btn o-btn-discret" onClick={() => enregistrer(true)}><Icon n="folder_open" />Enregistrer dans un autre dossier</button>
            )}
          </div>
          <div className="o-carte-blanche o-carte-action">
            <h2 className="o-t20"><Icon n="public" size={26} className="o-c-action" />Quand ton site est prêt</h2>
            <p className="o-aide o-lh145">Crée un dossier avec toutes tes pages. Il s'ouvre dans n'importe quel navigateur.</p>
            <button className="o-btn o-btn-principal o-btn-gros o-btn-18" data-aide="exporter" onClick={exporter} disabled={enCours}>
              <Icon n="download" size={24} />{enCours ? 'Export en cours…' : 'Exporter mon site'}
            </button>
            {erreur
              ? <span className="o-aide-erreur"><Icon n="error" size={20} />L'export n'a pas marché. Enregistre ton projet, puis réessaie.</span>
              : <span className="o-aide">Tu peux exporter même s'il reste des points rouges.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
