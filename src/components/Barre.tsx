// Barre du haut : des onglets, sans ordre imposé (Charte, Pages et Contenu se font dans l'ordre que l'on veut).
import { nomFichier, useProjet, type Etape } from '../etat';
import { dossierConseille } from '../data/constantes';
import { enregistrerProjet, fichierProjetConnu, peutChoisirDossier } from '../lib/fichier';
import { InvitationVisite, PanneauAide, VisiteGuidee } from './Aide';
import { ApercuPlein } from './ApercuPlein';
import { Icon } from './Icon';

export const ONGLETS: { etape: Etape; label: string; icon: string }[] = [
  { etape: 1, label: 'Mon projet', icon: 'badge' },
  { etape: 2, label: 'Charte graphique', icon: 'palette' },
  { etape: 3, label: 'Pages', icon: 'account_tree' },
  { etape: 4, label: 'Contenu', icon: 'edit' },
  { etape: 5, label: 'Vérifier et exporter', icon: 'task_alt' },
];

/** Enregistre le projet. `ailleurs` : choisir un autre dossier même si le fichier est déjà connu. */
export function useEnregistrer() {
  const { projet, setMessage, marquerEnregistre } = useProjet();
  return async (ailleurs = false) => {
    const r = await enregistrerProjet(projet, nomFichier(projet), ailleurs);
    if (!r) return; // fenêtre fermée sans enregistrer
    marquerEnregistre();
    setMessage({ type: 'enregistre', fichier: r.fichier, dossier: r.mode === 'dossier', premiereFois: r.mode === 'dossier' && r.premiereFois });
  };
}

export function Barre() {
  const { projet, etape, allerEtape, ui, setUi, modifie, sauvegarde } = useProjet();
  const fichier = fichierProjetConnu();
  const enregistre = !modifie && sauvegarde.etat === 'ok';
  // Info-bulle : où en est l'enregistrement automatique.
  const etatEnregistrement = enregistre
    ? `Enregistré automatiquement à ${sauvegarde.heure} dans « ${fichier} »`
    : sauvegarde.etat === 'autorisation'
      ? 'Clique une fois sur « Enregistrer » : ensuite, ton projet s’enregistrera tout seul.'
      : !fichier && peutChoisirDossier()
        ? `Choisis le dossier de ton équipe : ${dossierConseille(projet.meta.classe)}. Ensuite, ton projet s’enregistrera tout seul.`
        : fichier && sauvegarde.etat !== 'erreur'
          ? 'Tes modifications vont s’enregistrer automatiquement dans quelques secondes.'
          : 'Enregistrer ton projet';
  const enregistrer = useEnregistrer();
  return (
    <>
    <header className="o-barre">
      <div className="o-barre-marque">
        <span className="o-v" aria-hidden="true">V</span>
        <div className="o-barre-titres">
          <span className="o-barre-nom">Vitrine</span>
          <span className="o-barre-projet" title={projet.nom}>{projet.nom}</span>
        </div>
      </div>
      <nav aria-label="Parties de l'outil" className="o-etapes" data-aide="onglets">
        <ul>
          {ONGLETS.map((o) => (
            <li key={o.etape}>
              <button className="o-onglet-haut" aria-current={o.etape === etape ? 'page' : undefined} onClick={() => allerEtape(o.etape)}>
                <Icon n={o.icon} size={20} />{o.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="o-barre-actions">
        <button className="o-btn o-btn-discret" data-aide="aide" onClick={() => setUi({ aideOuverte: true })} title="Questions fréquentes et visite guidée"><Icon n="info" />Aide</button>
        <button className="o-btn o-btn-secondaire" data-aide="apercu" onClick={() => setUi({ apercu: true })} title="Voir ton site en plein écran"><Icon n="visibility" />Aperçu</button>
        <button
          className={`o-btn o-btn-secondaire o-btn-enregistrer${enregistre ? ' enregistre' : modifie ? ' a-faire' : ''}`}
          data-aide="enregistrer"
          onClick={() => enregistrer()}
          title={etatEnregistrement}
        >
          <Icon n={enregistre ? 'check_circle' : 'save'} />{enregistre ? 'Enregistré' : 'Enregistrer'}
          {!enregistre && modifie && <span className="o-point-alerte" aria-hidden="true" />}
          <span className="o-masque">. {etatEnregistrement}</span>
        </button>
      </div>
    </header>
    {ui.apercu && <ApercuPlein />}
    {ui.aideOuverte && <PanneauAide />}
    {ui.visite && <VisiteGuidee key={ui.visite} partie={ui.visite} />}
    {!ui.apercu && <InvitationVisite />}
    </>
  );
}

/** Bandeau vert sous la barre après un enregistrement ou un export. */
export function BandeauMessage() {
  const { message, setMessage, projet } = useProjet();
  if (!message) return null;
  return (
    <div role="status" className={`o-bandeau-succes${message.type === 'non-enregistre' ? ' alerte' : ''}`}>
      {message.type === 'non-enregistre'
        ? <Icon n="warning" size={28} className="o-c-alerte" />
        : <Icon n="task_alt" size={28} className="o-c-succes" />}
      <div className="o-bandeau-texte">
        {message.type === 'non-enregistre' ? (
          <>
            <strong>Ton projet n'est pas encore enregistré.</strong>
            <span>Clique sur «&nbsp;Enregistrer&nbsp;» et choisis le dossier de ton équipe : <strong>{dossierConseille(projet.meta.classe)}</strong>. Ensuite, ton projet s'enregistrera tout seul.</span>
          </>
        ) : message.type === 'enregistre' ? (
          <>
            <strong>Projet enregistré !</strong>
            {message.dossier && !message.premiereFois && (
              <span>Tes changements sont enregistrés dans «&nbsp;{message.fichier}&nbsp;».</span>
            )}
            {message.dossier && message.premiereFois && (
              <span>Le fichier «&nbsp;{message.fichier}&nbsp;» est dans le dossier que tu as choisi. Désormais, <strong>ton projet s'enregistre tout seul</strong> à chaque modification. À la prochaine séance, ouvre-le avec «&nbsp;Ouvrir mon projet&nbsp;».</span>
            )}
            {!message.dossier && (
              <span>Le fichier «&nbsp;{message.fichier}&nbsp;» est dans ton dossier Téléchargements. Range-le dans ton dossier : <strong>{dossierConseille(projet.meta.classe)}</strong>. À la prochaine séance, ouvre-le avec «&nbsp;Ouvrir mon projet&nbsp;».</span>
            )}
          </>
        ) : (
          <>
            <strong>Ton site est prêt !</strong>
            <span>Le fichier «&nbsp;{message.fichier}&nbsp;» est dans ton dossier Téléchargements. Ouvre-le, puis double-clique sur «&nbsp;index.html&nbsp;» pour voir ton site.</span>
          </>
        )}
      </div>
      <button className="o-btn-icone o-btn-discret" aria-label="Fermer le message" onClick={() => setMessage(null)}><Icon n="close" /></button>
    </div>
  );
}
