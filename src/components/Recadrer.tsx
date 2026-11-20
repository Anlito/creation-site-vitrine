import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { CADRAGE_CENTRE, bornerCadrage, styleCadrage, type Cadrage, type Img } from '../model';

/**
 * Fenêtre « Recadrer l'image » : l'image dans un cadre de la même forme que sur le site. On la glisse pour
 * choisir la partie visible, le curseur (ou la molette) zoome, « Centrer » revient au départ.
 * `forme` : rapport largeur / hauteur du cadre sur le site, ou « auto » (l'image entière, ex. bloc Image).
 * `bandeau` : le texte du bandeau d'accueil cache le bas à gauche de l'image ; la zone est montrée.
 */
export function Recadrer({ img, forme, bandeau, fermer, valider }: {
  img: Img; forme: number | 'auto'; bandeau?: boolean; fermer: () => void; valider: (c: Cadrage | undefined) => void;
}) {
  const [c, setC] = useState<Cadrage>(img.cadrage ?? CADRAGE_CENTRE);
  const [ratio, setRatio] = useState(typeof forme === 'number' ? forme : 4 / 3);
  const cadre = useRef<HTMLDivElement>(null);
  const glisse = useRef<{ x: number; y: number; depart: Cadrage } | null>(null);
  const premier = useRef<HTMLButtonElement>(null);

  // Bloc « Image » : le cadre a la forme de l'image elle-même.
  useEffect(() => {
    if (forme !== 'auto' || !img.src) return;
    const im = new Image();
    im.onload = () => setRatio(im.naturalWidth / Math.max(1, im.naturalHeight));
    im.src = img.src;
  }, [forme, img.src]);
  useEffect(() => { premier.current?.focus(); }, []);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); fermer(); return; }
      const pas = e.shiftKey ? 10 : 2;
      const d = { ArrowLeft: [pas, 0], ArrowRight: [-pas, 0], ArrowUp: [0, pas], ArrowDown: [0, -pas] }[e.key];
      if (d && (e.target as HTMLElement)?.tagName !== 'INPUT') { e.preventDefault(); setC((x) => bornerCadrage({ ...x, x: x.x + d[0], y: x.y + d[1] })); }
    };
    window.addEventListener('keydown', touche, true);
    return () => window.removeEventListener('keydown', touche, true);
  }, [fermer]);

  const bas = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    glisse.current = { x: e.clientX, y: e.clientY, depart: c };
  };
  const bouge = (e: React.PointerEvent) => {
    const g = glisse.current, el = cadre.current;
    if (!g || !el) return;
    // Glisser l'image vers la droite montre sa partie gauche : la position (en %) diminue.
    const k = 140 / c.zoom;
    setC(bornerCadrage({ ...g.depart, x: g.depart.x - ((e.clientX - g.x) / el.clientWidth) * k, y: g.depart.y - ((e.clientY - g.y) / el.clientHeight) * k }));
  };
  const zoomer = (z: number) => setC((x) => bornerCadrage({ ...x, zoom: z }));
  const molette = (e: React.WheelEvent) => zoomer(c.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
  const centre = c.x === 50 && c.y === 50 && c.zoom === 1;

  return (
    <div className="o-voile-recadrer" onClick={(e) => { if (e.target === e.currentTarget) fermer(); }}>
      <div className="o-recadrer" role="dialog" aria-modal="true" aria-labelledby="titre-recadrer">
        <div className="o-recadrer-tete">
          <h2 id="titre-recadrer" className="o-t20"><Icon n="crop" />Recadrer l'image</h2>
          <button className="o-btn o-btn-discret o-btn-icone" onClick={fermer} aria-label="Fermer"><Icon n="close" /></button>
        </div>
        <p className="o-aide">Glisse l'image pour choisir ce qui apparaît sur ton site, et zoome avec le curseur. Le cadre a la même forme que sur la page.</p>
        <div
          ref={cadre}
          className="o-recadrer-cadre"
          style={{ aspectRatio: String(ratio), width: `min(720px, 86vw, ${Math.round(ratio * 52)}vh)` }}
          onPointerDown={bas}
          onPointerMove={bouge}
          onPointerUp={() => { glisse.current = null; }}
          onPointerCancel={() => { glisse.current = null; }}
          onWheel={molette}
          data-testid="cadre-recadrer"
        >
          {img.src && <img src={img.src} alt="" draggable={false} style={styleCadrage(c)} />}
          {bandeau && <span className="o-recadrer-cache" aria-hidden="true">Le texte du bandeau cache cette partie</span>}
          <span className="o-recadrer-main" aria-hidden="true"><Icon n="open_with" size={20} />Glisse</span>
        </div>
        <div className="o-recadrer-zoom">
          <button className="o-btn o-btn-secondaire o-btn-icone" onClick={() => zoomer(c.zoom - 0.1)} aria-label="Dézoomer" disabled={c.zoom <= 1}><Icon n="zoom_out" /></button>
          <input type="range" min={1} max={3} step={0.05} value={c.zoom} aria-label="Zoom" onChange={(e) => zoomer(Number(e.target.value))} />
          <button className="o-btn o-btn-secondaire o-btn-icone" onClick={() => zoomer(c.zoom + 0.1)} aria-label="Zoomer" disabled={c.zoom >= 3}><Icon n="zoom_in" /></button>
          <span className="o-recadrer-pct">{Math.round(c.zoom * 100)} %</span>
        </div>
        <div className="o-ligne-boutons o-recadrer-pied">
          <button className="o-btn o-btn-discret" onClick={() => setC(CADRAGE_CENTRE)} disabled={centre}><Icon n="center_focus_strong" />Centrer</button>
          <span className="o-flex1" />
          <button ref={premier} className="o-btn o-btn-secondaire" onClick={fermer}>Annuler</button>
          <button className="o-btn o-btn-principal" onClick={() => { valider(centre ? undefined : c); fermer(); }}><Icon n="check" />Valider</button>
        </div>
      </div>
    </div>
  );
}
