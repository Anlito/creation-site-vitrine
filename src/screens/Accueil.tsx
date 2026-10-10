// Écran 1 : deux gros boutons, rien d'autre. L'accès enseignant reste discret en bas.
import { useState } from 'react';
import { Icon } from '../components/Icon';
import { useApp } from '../etat';
import { choisirFichierProjet, lireProjet, oublierFichierProjet } from '../lib/fichier';

export function Accueil() {
  const { allerA, allerEtape, ouvrirProjet } = useApp();
  const [erreur, setErreur] = useState<string | null>(null);

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
