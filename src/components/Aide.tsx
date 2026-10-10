// Aide pour une première utilisation : visite guidée de chaque partie, panneau de questions fréquentes,
// et petite carte qui propose la visite la première fois qu'un élève ouvre une partie.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NOMS_PARTIES, QUESTIONS, VISITES } from '../data/aide';
import { useProjet, type Etape } from '../etat';
import { Icon } from './Icon';

const simplifier = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Zone de l'élément visé, ou null s'il n'est pas à l'écran. */
function zoneDe(selecteur?: string): DOMRect | null {
  if (!selecteur) return null;
  const el = document.querySelector(selecteur);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width && r.height ? r : null;
}

/** Visite guidée : met chaque zone en lumière, avec une bulle d'explication. */
export function VisiteGuidee({ partie }: { partie: Etape }) {
  const { setUi } = useProjet();
  const etapes = VISITES[partie];
  const [i, setI] = useState(0);
  const [zone, setZone] = useState<DOMRect | null>(null);
  const bulle = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const etape = etapes[i];
  const fermer = () => setUi({ visite: null });

  // Cherche l'élément visé, le fait défiler à l'écran, et suit ses mouvements.
  useLayoutEffect(() => {
    const el = etape.cible ? document.querySelector(etape.cible) : null;
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const maj = () => setZone(zoneDe(etape.cible));
    maj();
    window.addEventListener('resize', maj);
    document.addEventListener('scroll', maj, true);
    return () => { window.removeEventListener('resize', maj); document.removeEventListener('scroll', maj, true); };
  }, [etape]);

  // Place la bulle à côté de la zone (dessous, sinon dessus, sinon au centre), sans sortir de l'écran.
  useLayoutEffect(() => {
    const b = bulle.current;
    if (!b) return;
    const l = b.offsetWidth, h = b.offsetHeight, m = 16;
    const W = window.innerWidth, H = window.innerHeight;
    if (!zone) { setPos({ left: (W - l) / 2, top: (H - h) / 2 }); return; }
    let top = zone.bottom + m;
    if (top + h > H - m) top = zone.top - h - m;
    if (top < m) top = Math.min(H - h - m, Math.max(m, zone.top + zone.height / 2 - h / 2));
    let left = zone.left + zone.width / 2 - l / 2;
    // Zone très haute (colonne entière) : bulle à côté plutôt que dessus.
    if (zone.height > H * 0.6) {
      top = Math.max(m, Math.min(H - h - m, zone.top + 40));
      left = zone.right + m + l < W ? zone.right + m : zone.left - l - m;
      if (left < m) left = zone.left + m;
    }
    setPos({ left: Math.max(m, Math.min(W - l - m, left)), top: Math.max(m, top) });
  }, [zone, i]);

  useEffect(() => {
    bulle.current?.focus();
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
      if (e.key === 'ArrowRight') setI((x) => Math.min(etapes.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
    // Abonnement unique : les flèches partent toujours de l'étape courante.
  }, []);

  const derniere = i === etapes.length - 1;
  const marge = 6;
  return (
    <div className="o-visite" role="dialog" aria-modal="true" aria-label={`Visite guidée : ${NOMS_PARTIES[partie]}`}>
      {zone
        ? <div className="o-visite-projecteur" style={{ left: zone.left - marge, top: zone.top - marge, width: zone.width + marge * 2, height: zone.height + marge * 2 }} />
        : <div className="o-visite-voile" />}
      <div ref={bulle} className="o-visite-bulle" tabIndex={-1} style={pos} aria-live="polite">
        <div className="o-visite-entete">
          <span className="o-visite-compteur">{NOMS_PARTIES[partie]} · {i + 1} sur {etapes.length}</span>
          {!derniere && <button className="o-visite-passer" onClick={fermer}>Passer la visite</button>}
        </div>
        <strong className="o-visite-titre">{etape.titre}</strong>
        <p className="o-visite-texte">{etape.texte}</p>
        <div className="o-visite-points" aria-hidden="true">{etapes.map((_, k) => <span key={k} className={k === i ? 'actif' : ''} />)}</div>
        <div className="o-visite-boutons">
          {i > 0 && <button className="o-btn o-btn-secondaire" onClick={() => setI(i - 1)}><Icon n="arrow_back" />Précédent</button>}
          {derniere
            ? <button className="o-btn o-btn-principal" onClick={fermer}>C'est parti !</button>
            : <button className="o-btn o-btn-principal" onClick={() => setI(i + 1)}>Suivant<Icon n="arrow_forward" /></button>}
        </div>
      </div>
    </div>
  );
}

/** Carte discrète, en bas à droite : propose la visite la première fois qu'on ouvre une partie. */
export function InvitationVisite() {
  const { etape, ui, setUi } = useProjet();
  if (!ui.nouveauProjet || ui.visite || ui.aideOuverte || ui.visitesProposees.includes(etape)) return null;
  const marquer = (lancer: boolean) => setUi((u) => ({ visitesProposees: [...u.visitesProposees, etape], visite: lancer ? etape : null }));
  return (
    <div className="o-invitation" role="complementary" aria-label="Visite guidée">
      <Icon n="lightbulb" size={28} className="o-c-action" />
      <div className="o-invitation-texte">
        <strong>Première fois dans «&nbsp;{NOMS_PARTIES[etape]}&nbsp;» ?</strong>
        <span>Une visite guidée te montre comment ça marche, en une minute.</span>
        <div className="o-ligne-boutons">
          <button className="o-btn o-btn-principal o-btn-40" onClick={() => marquer(true)}>Lancer la visite</button>
          <button className="o-btn o-btn-discret o-btn-40" onClick={() => marquer(false)}>Non merci</button>
        </div>
      </div>
    </div>
  );
}

/** Panneau d'aide : visite guidée de la partie en cours et questions fréquentes. */
export function PanneauAide() {
  const { etape, setUi } = useProjet();
  const [recherche, setRecherche] = useState('');
  const [ouverte, setOuverte] = useState<string | null>(null);
  const fermer = () => setUi({ aideOuverte: false });
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') fermer(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  const q = simplifier(recherche.trim());
  const trouvees = q ? QUESTIONS.filter((x) => simplifier(x.q + ' ' + x.r.join(' ')).includes(q)) : null;
  const groupes: { titre: string; questions: typeof QUESTIONS }[] = trouvees
    ? [{ titre: `${trouvees.length} réponse${trouvees.length > 1 ? 's' : ''}`, questions: trouvees }]
    : [
      { titre: `Dans « ${NOMS_PARTIES[etape]} »`, questions: QUESTIONS.filter((x) => x.partie === etape) },
      { titre: 'Partout dans Vitrine', questions: QUESTIONS.filter((x) => x.partie === 0) },
      { titre: 'Dans les autres parties', questions: QUESTIONS.filter((x) => x.partie !== 0 && x.partie !== etape) },
    ].filter((g) => g.questions.length);

  return (
    <>
      <div className="o-aide-fond" onClick={fermer} />
      <aside className="o-aide-panneau" role="dialog" aria-modal="true" aria-labelledby="titre-aide">
        <div className="o-aide-entete">
          <h2 id="titre-aide" className="o-t20"><Icon n="info" className="o-c-action" />Aide</h2>
          <button className="o-btn-icone o-btn-discret" aria-label="Fermer l'aide" onClick={fermer}><Icon n="close" /></button>
        </div>
        <button className="o-carte-choix o-aide-visite" onClick={() => setUi({ aideOuverte: false, visite: etape })}>
          <Icon n="lightbulb" size={28} className="o-c-action" />
          <span className="o-telechargement-texte"><strong>Visite guidée de «&nbsp;{NOMS_PARTIES[etape]}&nbsp;»</strong><span>Découvre cette partie étape par étape.</span></span>
        </button>
        <input type="search" className="o-champ" placeholder="Pose ta question : image, couleur, enregistrer…" aria-label="Chercher dans l'aide" value={recherche} onChange={(e) => setRecherche(e.target.value)} autoFocus />
        <div className="o-aide-questions">
          {groupes.map((g) => (
            <div key={g.titre} className="o-section-6">
              <span className="o-libelle o-c-2">{g.titre}</span>
              {g.questions.map((x) => (
                <div key={x.q} className={`o-question${ouverte === x.q ? ' ouverte' : ''}`}>
                  <button className="o-question-bouton" aria-expanded={ouverte === x.q} onClick={() => setOuverte(ouverte === x.q ? null : x.q)}>
                    <span>{x.q}</span><Icon n="expand_more" />
                  </button>
                  {ouverte === x.q && (
                    <ol className="o-reponse">{x.r.map((t) => <li key={t}>{t}</li>)}</ol>
                  )}
                </div>
              ))}
            </div>
          ))}
          {trouvees && trouvees.length === 0 && <span className="o-aide">Aucune réponse trouvée. Essaie un autre mot, ou demande à ton professeur.</span>}
        </div>
      </aside>
    </>
  );
}
