// Espace enseignant : tableau des projets évalués, évaluation d'un projet (aperçu en lecture seule,
// grille sur 20, contrôle automatique, commentaire), export CSV.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { GRILLE } from '../data/constantes';
import { useApp } from '../etat';
import { verifier } from '../lib/controle';
import { choisirFichierProjet, lireProjet, telecharger } from '../lib/fichier';
import { espaceEnseignantOuvert, essayerMotDePasse, verrouillerEspaceEnseignant } from '../lib/verrou';
import { nomDansListe, pagesActives, slug, type Projet } from '../model';
import { PageSite } from '../site/Site';

interface Evaluation {
  fichier: string;
  classe: string;
  projet: string;
  equipe: string;
  enregistre_le: string;
  criteres: boolean[];
  commentaire: string;
  controles: boolean[];
  /** Date de la dernière modification de l'évaluation. */
  evalue_le?: string;
}

const CLE = 'vitrine-evaluations';

// Les évaluations restent dans ce navigateur pour exporter toute la classe d'un coup.
function lireEvaluations(): Record<string, Evaluation> {
  try { return JSON.parse(localStorage.getItem(CLE) ?? '{}') ?? {}; } catch { return {}; }
}
function ecrireEvaluations(e: Record<string, Evaluation>) {
  try { localStorage.setItem(CLE, JSON.stringify(e)); } catch { /* stockage indisponible : l'export CSV reste possible pour la séance */ }
}

const dateLisible = (iso?: string) => {
  if (!iso) return 'date inconnue';
  const d = new Date(iso);
  return isNaN(+d) ? 'date inconnue' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const total = (c: boolean[]) => GRILLE.reduce((a, g, i) => a + (c[i] ? g.p : 0), 0);

function csv(evals: Evaluation[]) {
  const q = (s: string | number) => {
    const t = String(s);
    return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const courts = ['Infos du groupe', 'Titres', 'Textes alternatifs', 'Pages vides', '3 pages minimum', 'Logo', 'Contrastes', 'Slogan', 'Poids des images'];
  const entete = ['Classe', 'Projet', 'Équipe', 'Fichier', 'Enregistré le', 'Évalué le', ...GRILLE.map((g) => `${g.t} (/${g.p})`), 'Total (/20)', 'Commentaire', ...courts.map((c) => `Contrôle : ${c}`)];
  const lignes = evals.map((e) => [
    e.classe, e.projet, e.equipe, e.fichier, dateLisible(e.enregistre_le), dateLisible(e.evalue_le),
    ...GRILLE.map((g, i) => (e.criteres[i] ? g.p : 0)), total(e.criteres), e.commentaire,
    ...e.controles.map((c) => (c ? 'oui' : 'non')),
  ]);
  return '﻿' + [entete, ...lignes].map((l) => l.map(q).join(';')).join('\r\n') + '\r\n';
}

/** Entrée de l'espace enseignant : mot de passe demandé une fois par séance (jusqu'au rechargement). */
export function Enseignant() {
  const [ouvert, setOuvert] = useState(espaceEnseignantOuvert);
  return ouvert ? <EspaceEnseignant /> : <Verrou ouvrir={() => setOuvert(true)} />;
}

function Verrou({ ouvrir }: { ouvrir: () => void }) {
  const { allerA } = useApp();
  const [mot, setMot] = useState('');
  const [erreur, setErreur] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  useEffect(() => { champ.current?.focus(); }, []);
  const valider = (e: React.FormEvent) => {
    e.preventDefault();
    if (essayerMotDePasse(mot)) ouvrir();
    else { setErreur(true); setMot(''); champ.current?.focus(); }
  };
  return (
    <div className="o-ecran-centre o-verrou">
      <button className="o-btn o-btn-discret o-retour" onClick={() => allerA('accueil')}><Icon n="arrow_back" />Retour</button>
      <form className="o-verrou-carte" onSubmit={valider} noValidate>
        <span className="o-verrou-icone"><Icon n="lock" size={36} /></span>
        <h1 className="o-t28">Espace enseignant</h1>
        <label className="o-champ-groupe">
          <span className="o-libelle">Mot de passe</span>
          <input
            ref={champ}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            className={`o-champ o-champ-46${erreur ? ' en-erreur' : ''}`}
            value={mot}
            aria-invalid={erreur || undefined}
            aria-describedby={erreur ? 'erreur-mdp' : undefined}
            onChange={(e) => { setMot(e.target.value); setErreur(false); }}
          />
          {erreur && <span id="erreur-mdp" role="alert" className="o-aide-erreur"><Icon n="error" size={20} />Mot de passe incorrect.</span>}
        </label>
        <button type="submit" className="o-btn o-btn-principal o-btn-gros o-btn-18">Entrer</button>
        <span className="o-aide">Cet espace est réservé à l'enseignant.</span>
      </form>
    </div>
  );
}

const NB_CONTROLES = 9;

/** Classe sous forme courte pour trier et filtrer : « 4e B » → « 4B ». */
const classeCourte = (c: string) => c.replace(/\s+/g, '').replace(/^(\d)e/i, '$1').toUpperCase();

function EspaceEnseignant() {
  const { allerA } = useApp();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [fichier, setFichier] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [evals, setEvals] = useState<Record<string, Evaluation>>(lireEvaluations);
  useEffect(() => ecrireEvaluations(evals), [evals]);

  const ouvrir = async () => {
    const f = await choisirFichierProjet(false, 'vitrine-enseignant');
    if (!f) return;
    const r = await lireProjet(f);
    if (!r.ok) { setErreur(r.nom); return; }
    setErreur(null);
    setProjet(r.projet);
    setFichier(f.name);
  };

  const verrouiller = () => { verrouillerEspaceEnseignant(); allerA('accueil'); };

  return (
    <div className="o-ecran o-ecran-fixe">
      <header className="o-entete-enseignant">
        {projet
          ? <button className="o-btn o-btn-discret o-btn-42" onClick={() => setProjet(null)}><Icon n="arrow_back" />Projets évalués</button>
          : <button className="o-btn-icone o-btn-discret" aria-label="Revenir à l'accueil de Vitrine" title="Revenir à l'accueil" onClick={() => allerA('accueil')}><Icon n="arrow_back" /></button>}
        <span className="o-v o-v-34" aria-hidden="true">V</span>
        <span className="o-t17 o-gras">Vitrine · Espace enseignant</span>
        <span className="o-ml-auto" />
        <button className="o-btn o-btn-discret o-btn-42" onClick={verrouiller} title="Fermer l'espace enseignant : le mot de passe sera redemandé"><Icon n="lock" />Verrouiller</button>
      </header>
      {erreur && (
        <div role="alert" className="o-msg o-msg-erreur o-msg-ligne o-mx24">
          <Icon n="error" size={24} />
          <span className="o-flex1">«&nbsp;{erreur}&nbsp;» n'est pas un projet Vitrine. Choisis un fichier qui se termine par <strong>.vitrine</strong>.</span>
          <button className="o-btn-icone o-btn-discret" aria-label="Fermer le message" onClick={() => setErreur(null)}><Icon n="close" /></button>
        </div>
      )}
      {projet
        ? <Evaluer key={`${fichier}|${projet.nom}`} projet={projet} fichier={fichier} evals={evals} setEvals={setEvals} suivant={ouvrir} retour={() => setProjet(null)} />
        : <TableauDeBord evals={evals} setEvals={setEvals} ouvrir={ouvrir} />}
    </div>
  );
}

type SetEvals = React.Dispatch<React.SetStateAction<Record<string, Evaluation>>>;

/** Accueil de l'espace enseignant : ouvrir un projet, voir les projets déjà évalués, exporter. */
function TableauDeBord({ evals, setEvals, ouvrir }: { evals: Record<string, Evaluation>; setEvals: SetEvals; ouvrir: () => void }) {
  const [classe, setClasse] = useState('');
  const [confirmer, setConfirmer] = useState(false);
  const toutes = Object.entries(evals);
  const classes = [...new Set(toutes.map(([, e]) => classeCourte(e.classe)).filter(Boolean))].sort();
  const lignes = toutes
    .filter(([, e]) => !classe || classeCourte(e.classe) === classe)
    .sort(([, a], [, b]) => classeCourte(a.classe).localeCompare(classeCourte(b.classe)) || a.projet.localeCompare(b.projet, 'fr'));
  const moyenne = lignes.length ? lignes.reduce((a, [, e]) => a + total(e.criteres), 0) / lignes.length : 0;

  const exporter = () => {
    if (!lignes.length) return;
    telecharger(`evaluations-vitrine${classe ? '-' + slug(classe) : ''}.csv`, new Blob([csv(lignes.map(([, e]) => e))], { type: 'text/csv;charset=utf-8' }));
  };
  const supprimer = (cle: string) => setEvals((e) => { const n = { ...e }; delete n[cle]; return n; });

  return (
    <div className="o-tableau-bord">
      <section className="o-tb-ouvrir">
        <div className="o-tb-ouvrir-texte">
          <h1 className="o-t28">Évaluer les sites des équipes</h1>
          <p className="o-aide o-t17">Ouvre le fichier <strong>.vitrine</strong> d'une équipe : tu vois son site, le contrôle automatique et la grille sur 20. Tes évaluations sont gardées dans ce navigateur, puis exportées en CSV pour toute la classe.</p>
        </div>
        <button className="o-btn o-btn-principal o-btn-gros o-btn-18" onClick={ouvrir}><Icon n="folder_open" size={24} />Ouvrir le projet d'une équipe</button>
      </section>

      <section className="o-carte-blanche o-tb-liste">
        <div className="o-tb-entete">
          <h2 className="o-t20">Projets évalués <span className="o-pastille-nombre">{toutes.length}</span></h2>
          {classes.length > 1 && (
            <label className="o-ligne-boutons o-nowrap">
              <span className="o-c-2">Classe :</span>
              <select className="o-champ o-select-classe" value={classe} onChange={(e) => setClasse(e.target.value)}>
                <option value="">Toutes</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          )}
          <span className="o-ml-auto" />
          {lignes.length > 0 && <span className="o-c-2">Moyenne : <strong className="o-c-texte">{moyenne.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} / 20</strong></span>}
          <button className="o-btn o-btn-secondaire o-btn-42" onClick={exporter} disabled={!lignes.length}>
            <Icon n="table_view" />Exporter en CSV{classe ? ` (${classe})` : ''}
          </button>
        </div>

        {lignes.length === 0 ? (
          <div className="o-tb-vide">
            <Icon n="table_view" size={40} className="o-c-discret" />
            <strong>Aucun projet évalué pour l'instant</strong>
            <span>Ouvre le projet d'une équipe pour commencer. Il apparaîtra ici avec sa note.</span>
          </div>
        ) : (
          <div className="o-tb-defile">
            <table className="o-tb-table">
              <thead>
                <tr><th>Classe</th><th>Projet et équipe</th><th>Note</th><th>Contrôle automatique</th><th>Évalué le</th><th><span className="o-masque">Actions</span></th></tr>
              </thead>
              <tbody>
                {lignes.map(([cle, e]) => {
                  const reussis = e.controles.filter(Boolean).length;
                  const note = total(e.criteres);
                  return (
                    <tr key={cle}>
                      <td><span className="o-pastille-classe">{classeCourte(e.classe) || '—'}</span></td>
                      <td>
                        <strong>{e.projet}</strong>
                        <span className="o-tb-equipe">{e.equipe || 'Équipe non renseignée'}</span>
                      </td>
                      <td><span className={`o-note ${note >= 10 ? 'bonne' : 'faible'}`}>{note}<span> / 20</span></span></td>
                      <td>
                        <span className="o-tb-controles">
                          <span className="o-segments" aria-hidden="true">{e.controles.map((c, i) => <span key={i} className={c ? 'ok' : 'ko'} />)}</span>
                          {reussis} / {e.controles.length || NB_CONTROLES}
                        </span>
                      </td>
                      <td className="o-c-2">{e.evalue_le ? dateLisible(e.evalue_le) : '—'}</td>
                      <td>
                        <button className="o-btn-icone o-btn-icone-danger" aria-label={`Supprimer l'évaluation de ${e.projet}`} title="Supprimer cette évaluation" onClick={() => supprimer(cle)}><Icon n="delete" size={20} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {toutes.length > 0 && (
          <div className="o-tb-pied">
            <span className="o-aide">Pour modifier une évaluation, rouvre le fichier de l'équipe : ta note et ton commentaire sont retrouvés.</span>
            {confirmer ? (
              <span className="o-ligne-boutons o-nowrap">
                <span className="o-c-2">Tout effacer ?</span>
                <button className="o-btn o-btn-danger o-btn-40" onClick={() => { setEvals({}); setConfirmer(false); }}>Oui, effacer les {toutes.length}</button>
                <button className="o-btn o-btn-discret o-btn-40" onClick={() => setConfirmer(false)}>Annuler</button>
              </span>
            ) : (
              <button className="o-btn o-btn-danger o-btn-40" onClick={() => setConfirmer(true)}><Icon n="delete" />Tout effacer</button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/** Évaluation d'un projet : aperçu du site à gauche, note, contrôle et commentaire à droite. */
function Evaluer({ projet, fichier, evals, setEvals, suivant, retour }: {
  projet: Projet; fichier: string; evals: Record<string, Evaluation>; setEvals: SetEvals; suivant: () => void; retour: () => void;
}) {
  const pages = pagesActives(projet);
  const [pageId, setPageId] = useState(pages[0]?.id ?? 'accueil');
  const [appareil, setAppareil] = useState<'ordinateur' | 'telephone'>('ordinateur');
  const [voirReussis, setVoirReussis] = useState(false);
  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  const verifs = verifier(projet);
  const rates = verifs.filter((v) => !v.ok);
  const reussis = verifs.filter((v) => v.ok);

  const cle = `${fichier}|${projet.nom}`;
  const neuve = (): Evaluation => ({
    fichier, classe: projet.meta.classe ?? '', projet: projet.nom, equipe: projet.meta.equipe ?? '',
    enregistre_le: projet.meta.enregistre_le ?? '', criteres: GRILLE.map(() => false), commentaire: '', controles: verifs.map((v) => v.ok),
  });
  const ev: Evaluation = evals[cle] ?? neuve();
  // Chaque modification part de l'état le plus récent (clics rapides sur la grille).
  const majEval = (f: (e: Evaluation) => Partial<Evaluation>) =>
    setEvals((tout) => {
      const avant = tout[cle] ?? neuve();
      return { ...tout, [cle]: { ...avant, ...f(avant), controles: verifs.map((v) => v.ok), evalue_le: new Date().toISOString() } };
    });
  const note = total(ev.criteres);
  const enregistree = !!evals[cle];

  return (
    <>
      <div className="o-infos-projet">
        <div className="o-infos-titres">
          <strong className="o-t20">{projet.nom}</strong>
          <span className="o-c-2 o-infos-equipe">
            {projet.meta.classe && <span className="o-pastille-classe">{classeCourte(projet.meta.classe)}</span>}
            {projet.meta.equipe || 'Équipe non renseignée'}
          </span>
        </div>
        <span className="o-c-2 o-infos-fichier"><Icon n="save" size={20} className="o-ic-ligne" /> {fichier} · enregistré le {dateLisible(projet.meta.enregistre_le)}</span>
        <span className="o-ml-auto" />
        <span className="o-note o-note-grande" aria-label={`Note : ${note} sur 20`}>{note}<span> / 20</span></span>
      </div>

      <div className="o-enseignant">
        <div className="o-enseignant-apercu">
          <div className="o-barre-lecture">
            <label className="o-choix-page">
              <span className="o-c-2">Page :</span>
              <select className="o-champ o-select-page" value={page?.id} onChange={(e) => setPageId(e.target.value)}>
                {pages.map((p) => <option key={p.id} value={p.id}>{nomDansListe(projet, p)}{p.blocs.length === 0 ? ' (vide)' : ''}</option>)}
              </select>
              <span className="o-c-2 o-nowrap-texte">{pages.length} page{pages.length > 1 ? 's' : ''}</span>
            </label>
            <span className="o-ml-auto" />
            <div role="group" aria-label="Appareil" className="o-segmente">
              {([['ordinateur', 'Ordinateur', 'computer'], ['telephone', 'Téléphone', 'smartphone']] as const).map(([k, label, icon]) => (
                <button key={k} className="o-segment" aria-pressed={appareil === k} onClick={() => setAppareil(k)}><Icon n={icon} size={20} />{label}</button>
              ))}
            </div>
            <span className="o-pastille-grise"><Icon n="lock" size={20} />Lecture seule</span>
          </div>
          <div className={`o-cadre-lecture ${appareil}`}>
            {page ? (
              <div className={appareil === 'telephone' ? 'o-lecture-tel' : 'o-lecture-site o-force-ordi'} inert>
                <PageSite c={{ p: projet, page, outil: false }} />
              </div>
            ) : <div className="o-tb-vide"><strong>Ce site n'a aucune page.</strong></div>}
          </div>
        </div>

        <div className="o-enseignant-panneau">
          <div className="o-enseignant-defile">
            <section className="o-section-8" aria-labelledby="t-grille">
              <div className="o-grille-entete">
                <h2 id="t-grille" className="o-t18">Grille d'évaluation</h2>
                <span className="o-c-2 o-enseignant-etat">
                  <Icon n={enregistree ? 'task_alt' : 'info'} size={20} className={enregistree ? 'o-c-succes' : 'o-c-discret'} />
                  {enregistree ? 'Évaluation gardée' : 'Pas encore évalué'}
                </span>
              </div>
              <div className="o-jauge-note" aria-hidden="true"><span style={{ width: `${(note / 20) * 100}%` }} /></div>
              <div className="o-criteres">
                {GRILLE.map((g, i) => (
                  <label key={g.t} className={`o-critere${ev.criteres[i] ? ' coche' : ''}`}>
                    <input type="checkbox" checked={ev.criteres[i]} onChange={() => majEval((e) => ({ criteres: e.criteres.map((c, k) => (k === i ? !c : c)) }))} />
                    <span className="o-flex1">{g.t}</span>
                    <span className="o-critere-pts">{g.p} pt{g.p > 1 ? 's' : ''}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="o-section-8" aria-labelledby="t-controle">
              <div className="o-grille-entete">
                <h2 id="t-controle" className="o-t18">Contrôle automatique</h2>
                <span className={rates.length ? 'o-rouge-gras' : 'o-vert-gras'}>{reussis.length} / {verifs.length} réussis</span>
              </div>
              {rates.length > 0 && (
                <ul className="o-controles">
                  {rates.map((v) => (
                    <li key={v.id} className="ko">
                      <Icon n="cancel" size={22} />
                      <span><strong>{v.t}</strong><span className="o-controle-detail">{v.detail}</span></span>
                    </li>
                  ))}
                </ul>
              )}
              {reussis.length > 0 && (
                <button className="o-btn o-btn-discret o-btn-40 o-aligne-gauche" aria-expanded={voirReussis} onClick={() => setVoirReussis(!voirReussis)}>
                  <Icon n="check_circle" className="o-c-succes" />{voirReussis ? 'Masquer' : 'Voir'} les {reussis.length} contrôles réussis
                </button>
              )}
              {voirReussis && (
                <ul className="o-controles">
                  {reussis.map((v) => <li key={v.id} className="ok"><Icon n="check_circle" size={22} /><span>{v.t}</span></li>)}
                </ul>
              )}
            </section>

            <label className="o-champ-groupe">
              <span className="o-libelle o-t18">Commentaire pour l'équipe</span>
              <textarea className="o-champ o-zone" rows={4} placeholder="Exemple : Ajoutez une description à chaque image." value={ev.commentaire} onChange={(e) => { const commentaire = e.target.value; majEval(() => ({ commentaire })); }} />
            </label>
          </div>

          <div className="o-enseignant-actions">
            <button className="o-btn o-btn-secondaire o-btn-42" onClick={retour}><Icon n="arrow_back" />Retour à la liste</button>
            <span className="o-ml-auto" />
            <button className="o-btn o-btn-principal o-btn-42" onClick={suivant}>Équipe suivante<Icon n="arrow_forward" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
