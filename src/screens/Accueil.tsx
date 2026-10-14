// Écran 1 : deux gros boutons, rien d'autre. L'accès enseignant reste discret en bas.
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { useApp } from '../etat';
import { choisirFichierProjet, lireProjet, oublierFichierProjet } from '../lib/fichier';
import { effacerSecours, lireSecours, type Secours } from '../lib/secours';
import { estProjet, normaliserProjet } from '../model';

export function Accueil() {
  const { allerA, allerEtape, ouvrirProjet, setMessage } = useApp();
  const [erreur, setErreur] = useState<string | null>(null);
  // Travail qui n'a pas pu être enregistré dans un fichier (copie de secours du navigateur).
  const [secours, setSecours] = useState<Secours | null>(null);
  const [ignorer, setIgnorer] = useState(false);
  useEffect(() => { lireSecours().then((s) => setSecours(s && estProjet(s.projet) ? s : null)); }, []);

  const reprendre = () => {
    if (!secours) return;
    oublierFichierProjet();
    ouvrirProjet(normaliserProjet(secours.projet));
    allerEtape(4);
    setMessage({ type: 'non-enregistre', fichier: '' });
  };
  const quandSecours = secours && new Date(secours.date).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  const ouvrir = async () => {
    const f = await choisirFichierProjet(true);
    if (!f) return;
    const r = await lireProjet(f);
    if (!r.ok) { oublierFichierProjet(); setErreur(r.nom); return; }
    ouvrirProjet(r.projet);
    allerEtape(4);
  };

  return (
    <div className="o-ecran-centre o-accueil">
      <div className="o-logo-outil"><span className="o-v o-v-grand" aria-hidden="true">V</span><span>Vitrine</span></div>
      <div className="o-accueil-titres">
        <h1>Crée le site de ton concept store</h1>
        {!erreur && <p>Sans compte. Ton projet s'enregistre dans un fichier sur ton ordinateur.</p>}
      </div>
      <div className="o-accueil-choix">
        <button className="o-gros-choix o-gros-choix-principal" onClick={() => allerA('nommer')}>
          <Icon n="add_circle" size={56} />
          <span className="o-gros-choix-titre">Créer un nouveau projet</span>
          <span className="o-gros-choix-sous">Pour commencer ton site</span>
        </button>
        <button className={`o-gros-choix o-gros-choix-secondaire${erreur ? ' en-erreur' : ''}`} onClick={ouvrir}>
          <Icon n="folder_open" size={56} className="o-c-action" />
          <span className="o-gros-choix-titre">Ouvrir mon projet</span>
          <span className="o-gros-choix-sous">Le fichier enregistré la dernière fois</span>
        </button>
      </div>
      {secours && !erreur && (
        <div className="o-msg o-msg-alerte o-msg-large" role="status">
          <Icon n="warning" size={30} />
          <div className="o-msg-corps">
            <strong>Un travail non enregistré a été retrouvé sur cet ordinateur.</strong>
            <span>
              «&nbsp;{secours.projet.nom}&nbsp;»
              {secours.projet.meta.classe ? ` · ${secours.projet.meta.classe}` : ''}
              {secours.projet.meta.equipe ? ` · ${secours.projet.meta.equipe}` : ''} — modifié le {quandSecours}.
            </span>
            {ignorer ? (
              <div className="o-ligne-boutons">
                <span>Ce travail sera perdu. Tu es sûr ?</span>
                <button className="o-btn o-btn-danger" onClick={() => { effacerSecours(); setSecours(null); }}>Oui, l'effacer</button>
                <button className="o-btn o-btn-discret" onClick={() => setIgnorer(false)}>Non</button>
              </div>
            ) : (
              <div className="o-ligne-boutons">
                <button className="o-btn o-btn-contour-alerte" onClick={reprendre}><Icon n="undo" />Reprendre ce travail</button>
                <button className="o-btn o-btn-discret" onClick={() => setIgnorer(true)}>Ce n'est pas mon projet</button>
              </div>
            )}
          </div>
        </div>
      )}
      {erreur && (
        <div role="alert" className="o-msg o-msg-erreur o-msg-large">
          <Icon n="error" size={30} />
          <div className="o-msg-corps">
            <strong>Ce fichier ne peut pas être ouvert.</strong>
            <span>«&nbsp;{erreur}&nbsp;» n'est pas un projet Vitrine. Choisis le fichier qui se termine par <strong>.vitrine</strong>, par exemple «&nbsp;bocal-et-cie.vitrine&nbsp;».</span>
            <button className="o-btn o-btn-contour" onClick={ouvrir}><Icon n="folder_open" />Choisir un autre fichier</button>
          </div>
        </div>
      )}
      <button className="o-lien-enseignant" onClick={() => allerA('enseignant')}>Espace enseignant</button>
    </div>
  );
}
