// Espace enseignant : projet en lecture seule, contrôle automatique, grille sur 20, export CSV.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { GRILLE } from '../data/constantes';
import { useApp } from '../etat';
import { verifier } from '../lib/controle';
import { choisirFichierProjet, lireProjet, telecharger } from '../lib/fichier';
import { espaceEnseignantOuvert, essayerMotDePasse, verrouillerEspaceEnseignant } from '../lib/verrou';
import { pagesActives, slug, type Projet } from '../model';
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
  const entete = ['Classe', 'Projet', 'Équipe', 'Fichier', 'Enregistré le', ...GRILLE.map((g) => `${g.t} (/${g.p})`), 'Total (/20)', 'Commentaire', ...courts.map((c) => `Contrôle : ${c}`)];
  const lignes = evals.map((e) => [
    e.classe, e.projet, e.equipe, e.fichier, dateLisible(e.enregistre_le),
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

function EspaceEnseignant() {
  const { allerA } = useApp();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [fichier, setFichier] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [pageId, setPageId] = useState('accueil');
  const [evals, setEvals] = useState<Record<string, Evaluation>>(lireEvaluations);
  useEffect(() => ecrireEvaluations(evals), [evals]);

  const cle = projet ? `${fichier}|${projet.nom}` : '';
  const verifs = projet ? verifier(projet) : [];
  const ev: Evaluation | null = projet ? evals[cle] ?? {
    fichier, classe: projet.meta.classe ?? '', projet: projet.nom, equipe: projet.meta.equipe ?? '',
    enregistre_le: projet.meta.enregistre_le ?? '', criteres: GRILLE.map(() => false), commentaire: '', controles: verifs.map((v) => v.ok),
  } : null;
  const majEval = (m: Partial<Evaluation>) => ev && setEvals((e) => ({ ...e, [cle]: { ...ev, ...m, controles: verifs.map((v) => v.ok) } }));

  const ouvrir = async () => {
    const f = await choisirFichierProjet(false, 'vitrine-enseignant');
    if (!f) return;
    const r = await lireProjet(f);
    if (!r.ok) { setErreur(r.nom); return; }
    setErreur(null);
    setProjet(r.projet);
    setFichier(f.name);
    setPageId(pagesActives(r.projet)[0]?.id ?? 'accueil');
  };

  const exporterCsv = () => {
    const liste = Object.values(evals);
    if (!liste.length) return;
    const classe = [...new Set(liste.map((e) => e.classe).filter(Boolean))];
    telecharger(`evaluations-vitrine${classe.length === 1 ? '-' + slug(classe[0]) : ''}.csv`, new Blob([csv(liste)], { type: 'text/csv;charset=utf-8' }));
  };
  const nbEvals = Object.keys(evals).length;

  const pages = projet ? pagesActives(projet) : [];
  const page = pages.find((p) => p.id === pageId) ?? pages[0];

  return (
    <div className="o-ecran o-ecran-fixe">
      <header className="o-entete-enseignant">
        <button className="o-btn-icone o-btn-discret" aria-label="Revenir à l'accueil de Vitrine" title="Revenir à l'accueil" onClick={() => allerA('accueil')}><Icon n="arrow_back" /></button>
        <span className="o-v o-v-34" aria-hidden="true">V</span>
        <span className="o-t17 o-gras">Vitrine · Espace enseignant</span>
        <span className="o-ml-auto" />
        {nbEvals > 0 && <span className="o-c-2">{nbEvals} projet{nbEvals > 1 ? 's' : ''} évalué{nbEvals > 1 ? 's' : ''}</span>}
        {projet && <button className="o-btn o-btn-secondaire o-btn-42" onClick={ouvrir}><Icon n="folder_open" />Ouvrir un autre projet</button>}
        <button className="o-btn o-btn-principal o-btn-42" onClick={exporterCsv} disabled={!nbEvals}><Icon n="table_view" />Exporter en CSV</button>
        <button className="o-btn o-btn-discret o-btn-42" onClick={() => { verrouillerEspaceEnseignant(); allerA('accueil'); }} title="Fermer l'espace enseignant : le mot de passe sera redemandé"><Icon n="lock" />Verrouiller</button>
      </header>

      {!projet || !ev || !page ? (
        <div className="o-ecran-centre o-gap24">
          <Icon n="folder_open" size={56} className="o-c-action" />
          <h1 className="o-t28">Évaluer un projet</h1>
          <p className="o-aide o-t17 o-centre-texte">Ouvre le fichier .vitrine d'une équipe. Tes évaluations restent dans ce navigateur :<br />tu peux ouvrir les projets un par un, puis exporter toute la classe en CSV.</p>
          <button className="o-btn o-btn-principal o-btn-gros o-btn-18" onClick={ouvrir}><Icon n="folder_open" />Ouvrir un projet</button>
          {erreur && (
            <div role="alert" className="o-msg o-msg-erreur o-msg-large">
              <Icon n="error" size={30} />
              <div className="o-msg-corps">
                <strong>Ce fichier ne peut pas être ouvert.</strong>
                <span>«&nbsp;{erreur}&nbsp;» n'est pas un projet Vitrine. Choisis un fichier qui se termine par <strong>.vitrine</strong>.</span>
              </div>
            </div>
          )}
          {nbEvals > 0 && (
            <button className="o-btn o-btn-danger" onClick={() => setEvals({})}><Icon n="delete" />Effacer les {nbEvals} évaluations de ce navigateur</button>
          )}
        </div>
      ) : (
        <>
          <div className="o-infos-projet">
            <strong className="o-t20">{projet.nom}</strong>
            <span className="o-c-2">{[projet.meta.classe, projet.meta.equipe].filter(Boolean).join(' · ') || 'Classe et équipe non renseignées'}</span>
            <span className="o-c-2">{fichier} · enregistré le {dateLisible(projet.meta.enregistre_le)}</span>
            <span className="o-pastille-grise o-ml-auto"><Icon n="lock" size={20} />Lecture seule</span>
          </div>
          {erreur && (
            <div role="alert" className="o-msg o-msg-erreur o-msg-ligne o-mx24">
              <Icon n="error" size={24} />«&nbsp;{erreur}&nbsp;» n'est pas un projet Vitrine.
            </div>
          )}
          <div className="o-enseignant">
            <div className="o-enseignant-apercu">
              <div className="o-onglets-pages" role="group" aria-label="Pages du site">
                {pages.map((p) => (
                  <button key={p.id} className={`o-onglet-page o-onglet-page-38${p.blocs.length === 0 ? ' vide' : ''}`} aria-current={p.id === page.id ? 'page' : undefined} onClick={() => setPageId(p.id)}>
                    {p.parent ? `↳ ${p.nom}` : p.nom}{p.blocs.length === 0 && ' (vide)'}
                  </button>
                ))}
              </div>
              <div className="o-cadre-lecture" inert>
                <div className="o-lecture-site">
                  <PageSiteForce p={projet} pageId={page.id} />
                </div>
              </div>
            </div>
            <div className="o-enseignant-grille">
              <div className="o-section-8">
                <h2 className="o-t18">Contrôle automatique</h2>
                <ul className="o-controles-2col">
                  {verifs.map((v) => (
                    <li key={v.id} className={v.ok ? 'ok' : 'ko'} title={v.ok ? undefined : v.detail}>
                      <Icon n={v.ok ? 'check_circle' : 'cancel'} size={20} />{v.court}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="o-section-6">
                <div className="o-grille-entete">
                  <h2 className="o-t18">Grille d'évaluation</h2>
                  <span className="o-total">{total(ev.criteres)}<span> / 20</span></span>
                </div>
                {GRILLE.map((g, i) => (
                  <label key={g.t} className="o-critere">
                    <input type="checkbox" checked={ev.criteres[i]} onChange={() => majEval({ criteres: ev.criteres.map((c, k) => (k === i ? !c : c)) })} />
                    <span className="o-flex1">{g.t}</span>
                    <span className="o-critere-pts">{g.p} pts</span>
                  </label>
                ))}
              </div>
              <label className="o-champ-groupe">
                <span className="o-libelle">Commentaire pour l'équipe</span>
                <textarea className="o-champ o-zone" rows={3} placeholder="Exemple : Ajoutez une description à chaque image." value={ev.commentaire} onChange={(e) => majEval({ commentaire: e.target.value })} />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PageSiteForce({ p, pageId }: { p: Projet; pageId: string }) {
  const page = p.pages.find((x) => x.id === pageId)!;
  return (
    <div className="o-force-ordi">
      <PageSite c={{ p, page, outil: false }} />
    </div>
  );
}
