// Nouveau projet (nom, classe et prénoms du groupe obligatoires), et onglet « Mon projet » ensuite.
import { useEffect, useRef, useState } from 'react';
import { Barre, BandeauMessage, ONGLETS, useEnregistrer } from '../components/Barre';
import { Icon } from '../components/Icon';
import { dossierConseille } from '../data/constantes';
import { nomFichier, useApp, useProjet } from '../etat';
import { enregistrerProjet, oublierFichierProjet, peutChoisirDossier } from '../lib/fichier';
import { nouveauProjet, type Projet } from '../model';
import { classesProposees, DOSSIER_PROJET, useCollege } from '../lib/college';

export function Nommer() {
  const { allerA, allerEtape, ouvrirProjet, setUi, setMessage, marquerEnregistre } = useApp();
  const [nom, setNom] = useState('');
  const [classe, setClasse] = useState('');
  const [equipe, setEquipe] = useState('');
  const [essai, setEssai] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  useCollege(); // le chemin affiché suit les réglages du collège
  const erreur = essai && !nom.trim();
  useEffect(() => { champ.current?.focus(); }, []);

  const creer = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nom.trim();
    setEssai(true);
    if (!n) { champ.current?.focus(); return; }
    if (!classe.trim() || !equipe.trim()) return;
    oublierFichierProjet();
    const p = nouveauProjet(n);
    p.meta = { classe: classe.trim(), equipe: equipe.trim() };
    // Le clic sur « Créer mon projet » ouvre tout de suite la fenêtre « Enregistrer sous » :
    // le projet est rangé dans le dossier de l'équipe dès le départ, puis s'y enregistre tout seul.
    // (L'appel doit partir directement du clic, sinon le navigateur refuse d'ouvrir la fenêtre.)
    const enregistrement = peutChoisirDossier() ? enregistrerProjet(p, nomFichier(p)) : null;
    ouvrirProjet(p);
    setUi({ nouveauProjet: true });
    allerEtape(1);
    enregistrement?.then((r) => {
      if (!r) { setMessage({ type: 'non-enregistre', fichier: '' }); return; }
      if (r.mode === 'refuse') { setMessage({ type: 'refuse', fichier: '', raison: r.raison }); return; }
      marquerEnregistre();
      setMessage({ type: 'enregistre', fichier: r.fichier, dossier: r.mode === 'dossier', premiereFois: true });
    });
  };

  return (
    <div className="o-ecran-centre o-nommer">
      <button className="o-btn o-btn-discret o-retour" onClick={() => allerA('accueil')}><Icon n="arrow_back" />Retour</button>
      <form className="o-nommer-col" onSubmit={creer} noValidate>
        <span className="o-surtitre">Nouveau projet</span>
        <label className="o-nommer-question">
          <span>Comment s'appelle ton concept store ?</span>
          <input
            ref={champ}
            className={`o-champ-geant${erreur ? ' en-erreur' : ''}`}
            value={nom}
            maxLength={40}
            aria-invalid={erreur || undefined}
            aria-describedby="aide-nom"
            onChange={(e) => setNom(e.target.value)}
          />
          {erreur
            ? <span id="aide-nom" className="o-aide-erreur"><Icon n="error" size={20} />Écris le nom de ton concept store pour continuer.</span>
            : <span id="aide-nom" className="o-aide o-aide-17">Exemple : «&nbsp;Le Grenier Malin&nbsp;». Tu pourras le changer plus tard.</span>}
        </label>
        <ChampsEquipe classe={classe} equipe={equipe} setClasse={setClasse} setEquipe={setEquipe} verifier={essai} />
        {peutChoisirDossier() && (
          <div className="o-msg o-msg-info o-nommer-dossier">
            <Icon n="folder_open" />
            <span>
              Quand tu cliques sur «&nbsp;Créer mon projet&nbsp;», choisis le dossier <strong>{DOSSIER_PROJET}</strong> de ta classe&nbsp;:
              l'outil y crée lui-même le dossier de ton équipe&nbsp;:<br />
              <strong className="o-c-texte">{dossierConseille(classe, equipe)}</strong>.<br />
              Ensuite, ton projet s'y enregistre tout seul.
            </span>
          </div>
        )}
        <button type="submit" className="o-btn o-btn-principal o-btn-gros o-btn-20">Créer mon projet<Icon n="arrow_forward" size={24} /></button>
      </form>
    </div>
  );
}

function ChampsEquipe({ classe, equipe, setClasse, setEquipe, verifier }: { classe: string; equipe: string; setClasse: (s: string) => void; setEquipe: (s: string) => void; verifier: boolean }) {
  // Classes des réglages du collège (Labo Blocs) ; la classe d'un ancien projet reste proposée.
  useCollege();
  const classes = classesProposees();
  if (classe && !classes.includes(classe)) classes.push(classe);
  const sansClasse = verifier && !classe.trim();
  const sansEquipe = verifier && !equipe.trim();
  return (
    <div className="o-nommer-equipe">
      <label className="o-champ-groupe o-classe">
        <span className="o-libelle">Ta classe</span>
        <select className={`o-champ${sansClasse ? ' en-erreur' : ''}`} value={classe} aria-invalid={sansClasse || undefined} required onChange={(e) => setClasse(e.target.value)}>
          <option value="">Choisis ta classe</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {sansClasse && <span className="o-aide-erreur"><Icon n="error" size={20} />Choisis ta classe.</span>}
      </label>
      <label className="o-champ-groupe o-equipe">
        <span className="o-libelle">Les prénoms de ton groupe</span>
        <input className={`o-champ${sansEquipe ? ' en-erreur' : ''}`} value={equipe} maxLength={120} placeholder="Inès, Hugo, Maël, Sarah (webmaster : Inès)" aria-invalid={sansEquipe || undefined} required onChange={(e) => setEquipe(e.target.value)} />
        {sansEquipe && <span className="o-aide-erreur"><Icon n="error" size={20} />Écris les prénoms de ton groupe.</span>}
      </label>
    </div>
  );
}

/** Onglet « Mon projet » : nom, classe, groupe, puis libre choix de la suite. */
export function Demarrer() {
  const { projet, maj, allerEtape, allerA, fermerProjet, modifie } = useProjet();
  const enregistrer = useEnregistrer();
  const [quitter, setQuitter] = useState(false);

  const majNom = (nom: string) => maj((p): Projet => ({
    ...p,
    nom,
    // Le logo suit le nom tant que l'élève ne l'a pas écrit autrement.
    logo: p.logo.texte === p.nom ? { ...p.logo, texte: nom } : p.logo,
  }), 'nom');

  const sortir = () => { oublierFichierProjet(); fermerProjet(); allerA('accueil'); };

  return (
    <div className="o-ecran">
      <Barre />
      <BandeauMessage />
      <div className="o-demarrer">
        <div className="o-nommer-col">
          <span className="o-surtitre">Ton projet</span>
          <label className="o-nommer-question">
            <span>Comment s'appelle ton concept store ?</span>
            <input className="o-champ-geant" value={projet.nom} maxLength={40} onChange={(e) => majNom(e.target.value)} />
            {projet.nom.trim()
              ? <span className="o-aide o-aide-17">Le nom apparaît dans ton logo et en haut de chaque page.</span>
              : <span className="o-aide-erreur"><Icon n="error" size={20} />Écris le nom de ton concept store.</span>}
          </label>
          <ChampsEquipe
            classe={projet.meta.classe ?? ''}
            equipe={projet.meta.equipe ?? ''}
            setClasse={(classe) => maj((p) => ({ ...p, meta: { ...p.meta, classe } }), 'classe')}
            setEquipe={(equipe) => maj((p) => ({ ...p, meta: { ...p.meta, equipe } }), 'equipe')}
            verifier
          />
          <div className="o-demarrer-actions">
            <button className="o-btn o-btn-discret" onClick={() => (modifie ? setQuitter(true) : sortir())}><Icon n="arrow_back" />Revenir à l'accueil de Vitrine</button>
          </div>
          <div className="o-section-8">
            <span className="o-libelle o-t17">Et maintenant, par quoi veux-tu commencer ?</span>
            <span className="o-aide">Il n'y a pas d'ordre : tu peux passer d'une partie à l'autre quand tu veux, avec les onglets en haut.</span>
            <div className="o-grille-3 o-choix-suite">
              {ONGLETS.filter((o) => o.etape > 1 && o.etape < 5).map((o) => (
                <button key={o.etape} className="o-carte-choix o-suite" onClick={() => allerEtape(o.etape)}>
                  <Icon n={o.icon} size={28} className="o-c-action" /><strong>{o.label}</strong>
                  <span>{o.etape === 2 ? 'Couleurs, polices et logo' : o.etape === 3 ? 'Choisir et ranger les pages' : 'Remplir les pages avec des blocs'}</span>
                </button>
              ))}
            </div>
          </div>
          {quitter && (
            <div role="alert" className="o-msg o-msg-alerte">
              <Icon n="warning" size={26} />
              <div className="o-msg-corps">
                <strong>Tu n'as pas enregistré tes derniers changements.</strong>
                <span>Enregistre ton projet avant de quitter, sinon ton travail sera perdu.</span>
                <div className="o-ligne-boutons">
                  <button className="o-btn o-btn-contour-alerte" onClick={async () => { await enregistrer(); sortir(); }}><Icon n="save" />Enregistrer puis quitter</button>
                  <button className="o-btn o-btn-danger" onClick={sortir}>Quitter sans enregistrer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
