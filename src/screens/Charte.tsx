// Étape 2 — Charte graphique : onglets « Couleurs et polices » et « Mon logo ».
import { useState } from 'react';
import { Barre, BandeauMessage } from '../components/Barre';
import { Icon } from '../components/Icon';
import {
  CATEGORIES_SYMBOLES, COINS_IMAGES, FORMES_BOUTONS, MISES_EN_PAGE_LOGO, NOMS_SYMBOLES, PALETTES, PASTILLES_ACCENT, PASTILLES_PRINCIPALE,
  POLICES, SLOGAN_PAR_DEFAUT, SYMBOLES,
} from '../data/constantes';
import { useProjet } from '../etat';
import { choisirFichier } from '../lib/fichier';
import { preparerImage } from '../lib/image';
import {
  contraste, corrigerContraste, paletteDe, policesDe, uid, variablesSite,
  type Charte as TCharte, type Logo, type PoliceImportee, type Projet,
} from '../model';
import { FAMILLES_INTEGREES } from '../polices';
import { telechargerLogo, type TypeTelechargement } from '../lib/logo-image';
import { fondsLogo, LogoGrand, MarqueLogo, styleLogo } from '../site/Logo';
import { SiteEntete } from '../site/Site';

export function Charte() {
  const { ui, setUi } = useProjet();
  const onglet = ui.ongletCharte;
  return (
    <div className="o-ecran">
      <Barre />
      <BandeauMessage />
      <div className="o-charte">
        <section aria-label="Réglages de la charte" className="o-charte-panneau">
          <div role="tablist" aria-label="Charte graphique" className="o-onglets">
            <button role="tab" id="onglet-couleurs" aria-controls="panneau-charte" aria-selected={onglet === 'couleurs'} className="o-onglet" onClick={() => setUi({ ongletCharte: 'couleurs' })}>Couleurs et polices</button>
            <button role="tab" id="onglet-logo" aria-controls="panneau-charte" aria-selected={onglet === 'logo'} className="o-onglet" onClick={() => setUi({ ongletCharte: 'logo' })}>Mon logo</button>
          </div>
          <div key={onglet} id="panneau-charte" role="tabpanel" aria-labelledby={`onglet-${onglet}`} className="o-charte-defile">
            {onglet === 'couleurs' ? <ReglagesCouleurs /> : <ReglagesLogo />}
          </div>
        </section>
        {onglet === 'couleurs' ? <ApercuCharte /> : <ApercuLogo />}
      </div>
    </div>
  );
}

function useCharte() {
  const { projet, maj } = useProjet();
  const set = (c: Partial<TCharte>, cle?: string) => maj((p) => ({ ...p, charte: { ...p.charte, ...c } }), cle);
  return { projet, c: projet.charte, set };
}

/** Pastilles : la couleur de la palette d'abord, puis les autres propositions. */
const pastilles = (base: string, liste: string[]) => [base, ...liste.filter((h) => h.toLowerCase() !== base.toLowerCase())].slice(0, 9);

function ReglagesCouleurs() {
  const { c, set } = useCharte();
  const pal = paletteDe(c);
  const ratio = contraste(c.principale, pal.fond);
  const faible = ratio < 3;
  const lignes = [
    { cle: 'principale' as const, label: 'Couleur principale', aide: 'boutons, liens, menu', valeur: c.principale, liste: pastilles(pal.principale, PASTILLES_PRINCIPALE) },
    { cle: 'accent' as const, label: "Couleur d'accent", aide: 'petits détails', valeur: c.accent, liste: pastilles(pal.accent, PASTILLES_ACCENT) },
  ];
  return (
    <>
      <div className="o-entete-panneau">
        <h1 className="o-t24">Choisis tes couleurs</h1>
        <p className="o-aide">Commence par une palette. Tu pourras l'ajuster ensuite.</p>
      </div>

      <div className="o-section">
        <h2 className="o-t18">1. Une palette</h2>
        <div className="o-grille-palettes">
          {PALETTES.map((q) => (
            <button
              key={q.id}
              className="o-carte-choix o-palette"
              aria-pressed={q.id === c.palette}
              onClick={() => set({ palette: q.id, principale: q.principale, accent: q.accent })}
            >
              <span className="o-palette-bande"><span style={{ background: q.fond }} /><span style={{ background: q.principale }} /><span style={{ background: q.accent }} /></span>
              <span className="o-palette-nom">{q.nom}</span>
            </button>
          ))}
        </div>
        <button
          data-aide="ma-palette"
          className="o-carte-choix o-palette-perso"
          aria-pressed={c.palette === 'perso'}
          onClick={() => set({ palette: 'perso', perso: c.perso ?? { fond: pal.fond } })}
        >
          <span className="o-palette-bande o-palette-bande-perso"><span style={{ background: c.perso?.fond ?? pal.fond }} /><span style={{ background: c.principale }} /><span style={{ background: c.accent }} /></span>
          <span className="o-palette-perso-texte"><strong>Ma palette</strong><span>Choisis toi-même tes 3 couleurs : le fond, la principale et l'accent.</span></span>
        </button>
      </div>

      <div className="o-section o-section-14" data-aide="couleurs">
        <h2 className="o-t18">2. Ajuste tes couleurs</h2>
        {c.palette === 'perso' && (
          <div className="o-ligne-couleurs" role="group" aria-label="Couleur du fond">
            <span className="o-libelle">Couleur du fond <span className="o-facultatif">· derrière tout le site</span></span>
            <div className="o-pastilles">
              {FONDS_PERSO.map((hex) => (
                <button key={hex} className="o-pastille" aria-label={`Fond ${hex}`} aria-pressed={hex === pal.fond} style={{ background: hex }} onClick={() => set({ perso: { fond: hex } })} />
              ))}
              <label className="o-autre-couleur">
                <input type="color" value={pal.fond} aria-label="Autre couleur de fond" onChange={(e) => set({ perso: { fond: e.target.value.toUpperCase() } }, 'autre-fond')} />
                Autre
              </label>
            </div>
            <span className="o-aide">Le texte passe tout seul en noir ou en blanc pour rester lisible.</span>
          </div>
        )}
        {lignes.map((l) => (
          <div key={l.cle} className="o-ligne-couleurs" role="group" aria-label={l.label}>
            <span className="o-libelle">{l.label} <span className="o-facultatif">· {l.aide}</span></span>
            <div className="o-pastilles">
              {l.liste.map((hex) => (
                <button
                  key={hex}
                  className="o-pastille"
                  aria-label={`Couleur ${hex}`}
                  aria-pressed={hex.toLowerCase() === l.valeur.toLowerCase()}
                  style={{ background: hex }}
                  onClick={() => set({ [l.cle]: hex })}
                />
              ))}
              <label className="o-autre-couleur">
                <input type="color" value={l.valeur} aria-label={`Autre ${l.label.toLowerCase()}`} onChange={(e) => set({ [l.cle]: e.target.value.toUpperCase() }, `autre-${l.cle}`)} />
                Autre
              </label>
            </div>
          </div>
        ))}
        {faible ? (
          <div role="alert" className="o-msg o-msg-alerte">
            <Icon n="warning" size={26} />
            <div className="o-msg-corps">
              <strong className="o-t17">Cette couleur se lit mal sur ton fond.</strong>
              <span>Tes titres et tes liens seront difficiles à lire, surtout de loin. Choisis une couleur plus foncée.</span>
              <button className="o-btn o-btn-contour-alerte" onClick={() => set({ principale: corrigerContraste(c.principale, pal.fond) })}>
                <Icon n="auto_fix_high" size={20} />Foncer la couleur pour moi
              </button>
            </div>
          </div>
        ) : (
          <div role="status" className="o-ok"><Icon n="check_circle" />Tes couleurs sont bien lisibles.</div>
        )}
      </div>

      <div className="o-section" data-aide="polices">
        <h2 className="o-t18">3. Tes polices</h2>
        <div className="o-grille-2">
          {POLICES.map((f) => (
            <button key={f.id} className="o-carte-choix o-police" aria-pressed={f.id === c.polices} onClick={() => set({ polices: f.id })}>
              <span className="o-police-titre" style={{ fontFamily: f.titre, fontWeight: Number(f.graisse), textTransform: f.casse }}>Titre</span>
              <span className="o-police-texte" style={{ fontFamily: f.texte }}>Un texte facile à lire.</span>
              <span className="o-police-nom">{f.nom}</span>
            </button>
          ))}
        </div>
        <MesPolices />
      </div>

      <div className="o-section">
        <h2 className="o-t18">4. Forme des boutons</h2>
        <div className="o-grille-3">
          {FORMES_BOUTONS.map((f) => (
            <button key={f.id} className="o-carte-choix o-forme" aria-pressed={f.id === c.boutons} onClick={() => set({ boutons: f.id })}>
              <span className="o-forme-dessin" style={{ height: 32, borderRadius: f.rayon }} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="o-section">
        <h2 className="o-t18">5. Coins des images</h2>
        <div className="o-grille-3">
          {COINS_IMAGES.map((f) => (
            <button key={f.id} className="o-carte-choix o-forme" aria-pressed={f.id === c.images} onClick={() => set({ images: f.id })}>
              <span className="o-forme-dessin" style={{ height: 52, borderRadius: f.rayon }} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** Maquette de page d'accueil qui suit chaque réglage. */
function ApercuCharte() {
  const { projet } = useProjet();
  const accueil = projet.pages.find((p) => p.id === 'accueil')!;
  const bandeau = accueil.blocs.find((b) => b.type === 'banniere');
  const slogan = bandeau && bandeau.type === 'banniere' && bandeau.slogan.trim() && bandeau.slogan !== SLOGAN_PAR_DEFAUT
    ? bandeau.slogan : 'Ton slogan apparaîtra ici, en grand.';
  const cartes = [
    { icon: 'storefront', t: 'Le concept', d: 'Comment marche notre magasin.' },
    { icon: 'shopping_basket', t: 'Nos produits', d: 'Tout ce que tu trouves chez nous.' },
    { icon: 'pin_drop', t: 'Contact', d: 'Adresse et horaires.' },
  ];
  return (
    <section aria-label="Aperçu" className="o-apercu-charte">
      <div className="o-apercu-entete">
        <span className="o-t17 o-gras">Aperçu de ta page d'accueil</span>
        <span className="o-pastille-info"><Icon n="sync" size={20} className="o-c-action" />Toutes tes pages changent en même temps</span>
      </div>
      <div className="o-apercu-defile">
        <div className="o-cadre-page" aria-hidden="true">
          <div className="site" style={variablesSite(projet) as React.CSSProperties}>
            <SiteEntete c={{ p: projet, page: accueil, outil: true }} />
            <div className="s-demo">
              <div className="s-ph s-demo-img"><span className="s-ph-texte">Photo de la boutique</span></div>
              <div className="s-demo-texte">
                <span className="s-demo-sur">{projet.nom}</span>
                <h1 className="s-h s-demo-titre">{slogan}</h1>
                <p className="s-demo-p">Voici à quoi ressemblera le texte de ton site. <span className="s-demo-lien">Découvre notre concept</span>.</p>
                <div className="s-demo-boutons">
                  <span className="s-btn">Voir nos produits</span>
                  <span className="s-btn s-btn-contour">Nous trouver</span>
                </div>
              </div>
              <div className="s-demo-cartes">
                {cartes.map((k) => (
                  <div key={k.t} className="s-demo-carte">
                    <span className="s-demo-icone"><Icon n={k.icon} size={20} /></span>
                    <strong className="s-h">{k.t}</strong>
                    <span>{k.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function useLogo() {
  const { projet, maj } = useProjet();
  const set = (l: Partial<Logo>, cle?: string) => maj((p): Projet => ({ ...p, logo: { ...p.logo, ...l } }), cle);
  return { projet, L: projet.logo, set };
}

function SchemaMiseEnPage({ id }: { id: string }) {
  switch (id) {
    case 'dessus': return <span className="o-schema o-schema-dessus"><span className="o-schema-rond" /><span className="o-schema-barre" style={{ width: 44 }} /></span>;
    case 'gauche': return <span className="o-schema o-schema-gauche"><span className="o-schema-rond" /><span className="o-schema-barre" style={{ width: 36 }} /></span>;
    case 'texte': return <span className="o-schema"><span className="o-schema-barre" style={{ width: 56, height: 9 }} /></span>;
    case 'rond': return <span className="o-schema-cercle"><span className="o-schema-rond o-petit" /><span className="o-schema-barre" style={{ width: 24, height: 5 }} /></span>;
    default: return <span className="o-schema-carre"><span className="o-schema-rond o-petit" /><span className="o-schema-barre" style={{ width: 26, height: 5 }} /></span>;
  }
}

function ReglagesLogo() {
  const { projet, L, set } = useLogo();
  const [erreurImport, setErreurImport] = useState(false);

  const importer = async () => {
    const f = await choisirFichier('image/png,image/jpeg');
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) { setErreurImport(true); return; }
    try {
      const im = await preparerImage(f);
      setErreurImport(false);
      set({ image_importee: im.src });
    } catch {
      setErreurImport(true);
    }
  };

  return (
    <>
      <h1 className="o-t24">Crée ton logo</h1>
      <label className="o-champ-groupe">
        <span className="o-libelle o-t17">1. Nom dans le logo</span>
        <input className="o-champ o-champ-46" value={L.texte} maxLength={40} onChange={(e) => set({ texte: e.target.value }, 'logo-texte')} placeholder={projet.nom} />
      </label>

      <ChoixSymbole valeur={L.symbole} choisir={(symbole) => set({ symbole })} />

      <div className="o-section-8" role="group" aria-labelledby="t-mise">
        <span id="t-mise" className="o-libelle o-t17">3. La mise en page</span>
        <div className="o-grille-5">
          {MISES_EN_PAGE_LOGO.map((m) => (
            <button key={m.id} className="o-carte-choix o-mise" aria-pressed={L.mise_en_page === m.id} onClick={() => set({ mise_en_page: m.id })}>
              <SchemaMiseEnPage id={m.id} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="o-section-8" role="group" aria-labelledby="t-couleurs-logo">
        <span id="t-couleurs-logo" className="o-libelle o-t17">4. Les couleurs</span>
        <div className="o-segmente o-segmente-plein">
          <button aria-pressed={L.couleurs === 'charte'} onClick={() => set({ couleurs: 'charte' })} className="o-segment o-segment-42">
            <span className="o-duo"><span style={{ background: projet.charte.principale }} /><span style={{ background: projet.charte.accent }} /></span>
            Ma charte
          </button>
          <button aria-pressed={L.couleurs === 'un-ton'} onClick={() => set({ couleurs: 'un-ton' })} className="o-segment o-segment-42">Un seul ton</button>
          <button aria-pressed={L.couleurs === 'perso'} onClick={() => set({ couleurs: 'perso' })} className="o-segment o-segment-42">Mes couleurs</button>
        </div>
        {L.couleurs === 'perso' && (
          <div className="o-grille-2">
            {([['couleurSymbole', 'Couleur du symbole', projet.charte.principale], ['couleurTexte', 'Couleur du texte', paletteDe(projet.charte).texte]] as const).map(([cle, label, defaut]) => (
              <label key={cle} className="o-choix-couleur">
                <input type="color" value={L[cle] ?? defaut} onChange={(e) => set({ [cle]: e.target.value.toUpperCase() }, cle)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <PersonnaliserLogo />

      <div className="o-encadre-pointille">
        <span className="o-libelle o-t17">Ton équipe a déjà un logo ?</span>
        <span className="o-aide">Image PNG ou JPG, carrée si possible.</span>
        {erreurImport && <span className="o-aide-erreur"><Icon n="error" size={20} />Cette image ne peut pas être utilisée. Choisis un fichier PNG ou JPG.</span>}
        <div className="o-ligne-boutons">
          <button className="o-btn o-btn-secondaire" onClick={importer}><Icon n="upload" />{L.image_importee ? 'Changer de logo' : 'Importer mon logo'}</button>
          {L.image_importee && <button className="o-btn o-btn-danger" onClick={() => set({ image_importee: undefined })}><Icon n="delete" />Retirer ce logo</button>}
        </div>
      </div>
    </>
  );
}

function ApercuLogo() {
  const { projet } = useProjet();
  const fonds = fondsLogo(projet);
  const nom = projet.logo.texte.trim() || projet.nom;
  const aSymbole = !!projet.logo.symbole || !!projet.logo.image_importee;
  return (
    <section aria-label="Aperçu de ton logo" className="o-apercu-logo">
      <span className="o-t17 o-gras">Aperçu de ton logo</span>
      <div className="o-logo-cartes">
        <div className="o-logo-carte" style={{ background: fonds.clair }}><LogoGrand p={projet} fonce={false} /></div>
        <div className="o-logo-carte" style={{ background: fonds.fonce }}><LogoGrand p={projet} fonce /></div>
        <span className="o-aide">Sur fond clair</span>
        <span className="o-aide">Sur fond foncé</span>
      </div>
      <span className="o-t17 o-gras o-mt10">En tout petit, dans l'onglet du navigateur</span>
      <div className="o-onglets-nav" aria-hidden="true">
        <div className="o-onglet-nav o-onglet-nav-actif">
          <MarqueLogo p={projet} taille={18} icone={13} />
          <span className="o-onglet-nav-titre">{nom} · Accueil</span>
          <Icon n="close" size={18} className="o-c-2" />
        </div>
        <div className="o-onglet-nav"><span className="o-onglet-nav-gris" />Nouvel onglet</div>
      </div>
      {aSymbole ? (
        <div className="o-ok o-ok-discret"><Icon n="check_circle" className="o-c-succes" />En petit, seul le symbole est gardé : il reste reconnaissable.</div>
      ) : (
        <div className="o-ok o-ok-discret"><Icon n="info" className="o-c-action" />Choisis un symbole : en petit, c'est lui qui reste dans l'onglet.</div>
      )}
      <TelechargerLogo />
    </section>
  );
}

/** Version courte de la charte, ouverte depuis l'éditeur (bouton « Ma charte »). */
export function CharteRapide() {
  const { c, set } = useCharte();
  const { allerEtape, setUi } = useProjet();
  const pol = policesDe(c);
  return (
    <>
      <div className="o-entete-panneau">
        <h2 className="o-t19">Ma charte</h2>
        <p className="o-aide">Les changements s'appliquent à toutes tes pages.</p>
      </div>
      <div className="o-section-8" role="group" aria-labelledby="t-pal-rapide">
        <span id="t-pal-rapide" className="o-libelle">Palette</span>
        {PALETTES.map((q) => (
          <button key={q.id} className="o-carte-choix o-palette-ligne" aria-pressed={q.id === c.palette} onClick={() => set({ palette: q.id, principale: q.principale, accent: q.accent })}>
            <span className="o-trio"><span style={{ background: q.fond }} /><span style={{ background: q.principale }} /><span style={{ background: q.accent }} /></span>
            {q.nom}
            {q.id === c.palette && <Icon n="check_circle" className="o-c-action o-ml-auto" />}
          </button>
        ))}
        {c.perso && (
          <button className="o-carte-choix o-palette-ligne" aria-pressed={c.palette === 'perso'} onClick={() => set({ palette: 'perso' })}>
            <span className="o-trio"><span style={{ background: c.perso.fond }} /><span style={{ background: c.principale }} /><span style={{ background: c.accent }} /></span>
            Ma palette
            {c.palette === 'perso' && <Icon n="check_circle" className="o-c-action o-ml-auto" />}
          </button>
        )}
      </div>
      <label className="o-champ-groupe">
        <span className="o-libelle">Polices</span>
        <select className="o-champ" value={c.polices} onChange={(e) => set({ polices: e.target.value })}>
          {POLICES.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          {c.policesPerso && <option value="perso">Mes polices</option>}
        </select>
        <span className="o-aide" style={{ fontFamily: pol.titre }}>Titre en {pol.nom.toLowerCase()}</span>
      </label>
      <button className="o-btn o-btn-secondaire" onClick={() => { setUi({ ongletCharte: 'couleurs', panneau: 'bloc' }); allerEtape(2); }}>
        Ouvrir toute la charte<Icon n="open_in_new" />
      </button>
    </>
  );
}

const FONDS_PERSO = ['#FFFFFF', '#FFF8EE', '#F3F4F6', '#EEF6F1', '#FDF0F3', '#EEF3FB', '#111114', '#0F1A2B', '#1E3A2F'];

/** Nom de famille tiré du fichier : « PlayfairDisplay-Bold.ttf » → « Playfair Display ». */
function nomDeFamille(fichier: string) {
  const base = fichier.replace(/\.[^.]+$/, '').replace(/\[.*?\]/g, '').split(/[-_]/)[0] || 'Ma police';
  return base.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

const FORMATS: Record<string, PoliceImportee['format']> = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };

const lireDataUrl = (f: Blob) => new Promise<string>((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok(r.result as string);
  r.onerror = () => ko(r.error);
  r.readAsDataURL(f);
});

const familleCss = (css: string) => css.match(/'([^']+)'/)?.[1] ?? '';

/** Polices perso : choisir les polices des titres et du texte, et importer des polices gratuites. */
function MesPolices() {
  const { c, set } = useCharte();
  const [erreur, setErreur] = useState<string | null>(null);
  const importees = c.policesImportees ?? [];
  const actuelles = policesDe(c);
  const choix = c.policesPerso ?? { titre: familleCss(actuelles.titre), texte: familleCss(actuelles.texte) };
  const familles = [...importees.map((x) => x.famille), ...FAMILLES_INTEGREES];

  const importer = async () => {
    const fichier = await choisirFichier('.ttf,.otf,.woff,.woff2');
    if (!fichier) return;
    const ext = fichier.name.split('.').pop()?.toLowerCase() ?? '';
    const format = FORMATS[ext];
    if (!format) { setErreur('Choisis un fichier de police : il se termine par .ttf, .otf, .woff ou .woff2.'); return; }
    if (fichier.size > 2 * 1024 * 1024) { setErreur('Cette police est trop lourde (plus de 2 Mo). Choisis le fichier « Regular » plutôt que le fichier complet.'); return; }
    let famille = nomDeFamille(fichier.name);
    const pris = new Set([...importees.map((x) => x.famille), ...FAMILLES_INTEGREES]);
    for (let i = 2; pris.has(famille); i++) famille = `${nomDeFamille(fichier.name)} ${i}`;
    try {
      // On vérifie que le navigateur sait lire ce fichier avant de l'ajouter.
      await new FontFace(famille, await fichier.arrayBuffer()).load();
    } catch {
      setErreur('Ce fichier ne peut pas être lu comme une police. Essaie un autre fichier .ttf.');
      return;
    }
    const police: PoliceImportee = { id: uid(), famille, fichier: fichier.name, format, donnees: await lireDataUrl(fichier) };
    setErreur(null);
    set({ policesImportees: [...importees, police], polices: 'perso', policesPerso: { titre: famille, texte: choix.texte } });
  };

  const retirer = (p: PoliceImportee) => {
    const reste = importees.filter((x) => x.id !== p.id);
    const repli = (f: string) => (f === p.famille ? 'Lexend' : f);
    set({ policesImportees: reste, policesPerso: { titre: repli(choix.titre), texte: repli(choix.texte) } });
  };

  return (
    <div className={`o-mes-polices${c.polices === 'perso' ? ' actif' : ''}`}>
      <button className="o-carte-choix o-palette-perso" aria-pressed={c.polices === 'perso'} onClick={() => set({ polices: 'perso', policesPerso: choix })}>
        <span className="o-police-titre" style={{ fontFamily: `'${choix.titre}'`, minWidth: 80 }}>Titre</span>
        <span className="o-palette-perso-texte"><strong>Mes polices</strong><span>Choisis une police pour les titres et une pour le texte, ou importe une police gratuite.</span></span>
      </button>
      {c.polices === 'perso' && (
        <div className="o-mes-polices-corps">
          {(['titre', 'texte'] as const).map((k) => (
            <label key={k} className="o-champ-groupe">
              <span className="o-libelle">{k === 'titre' ? 'Police des titres' : 'Police du texte'}</span>
              <select className="o-champ" value={choix[k]} style={{ fontFamily: `'${choix[k]}'` }} onChange={(e) => set({ policesPerso: { ...choix, [k]: e.target.value } })}>
                {importees.length > 0 && (
                  <optgroup label="Mes polices importées">
                    {importees.map((x) => <option key={x.id} value={x.famille}>{x.famille}</option>)}
                  </optgroup>
                )}
                <optgroup label="Polices de Vitrine">
                  {FAMILLES_INTEGREES.filter((x) => !importees.some((i) => i.famille === x)).map((x) => <option key={x} value={x}>{x}</option>)}
                </optgroup>
              </select>
            </label>
          ))}
          {familles.length > 0 && choix.texte && ['Pacifico'].includes(choix.texte) && (
            <span className="o-aide-erreur"><Icon n="warning" size={20} />Une police manuscrite se lit mal pour un long texte : garde-la pour les titres.</span>
          )}
          <div className="o-encadre-pointille">
            <span className="o-libelle">Ajouter une police gratuite</span>
            <span className="o-aide">Sur <strong>fonts.google.com</strong>, choisis une police, clique sur «&nbsp;Get font&nbsp;» puis «&nbsp;Download all&nbsp;». Ouvre le dossier téléchargé et choisis le fichier qui finit par <strong>-Regular.ttf</strong>.</span>
            {erreur && <span className="o-aide-erreur"><Icon n="error" size={20} />{erreur}</span>}
            <button className="o-btn o-btn-secondaire" onClick={importer}><Icon n="upload" />Importer une police</button>
            {importees.length > 0 && (
              <ul className="o-liste-polices">
                {importees.map((x) => (
                  <li key={x.id}>
                    <span style={{ fontFamily: `'${x.famille}'`, fontSize: 20 }}>{x.famille}</span>
                    <span className="o-c-2 o-flex1">{x.fichier}</span>
                    <button className="o-btn-icone o-btn-icone-danger" aria-label={`Retirer la police ${x.famille}`} title="Retirer" onClick={() => retirer(x)}><Icon n="delete" size={20} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Réglages fins du logo : phrase, police, style, tailles, forme. */
function PersonnaliserLogo() {
  const { projet, L, set } = useLogo();
  const s = styleLogo(projet);
  const familles = [...(projet.charte.policesImportees ?? []).map((x) => x.famille), ...FAMILLES_INTEGREES];
  const curseur = (cle: 'tailleTexte' | 'tailleSymbole', label: string) => (
    <label className="o-curseur">
      <span className="o-libelle">{label} <span className="o-facultatif">· {Math.round((L[cle] ?? 1) * 100)} %</span></span>
      <input type="range" min={70} max={150} step={5} value={Math.round((L[cle] ?? 1) * 100)} onChange={(e) => set({ [cle]: Number(e.target.value) / 100 }, cle)} />
    </label>
  );
  const formes = [
    { id: 'rond', label: 'Rond', r: '50%' }, { id: 'arrondi', label: 'Arrondi', r: '22%' },
    { id: 'carre', label: 'Carré', r: '0' }, { id: 'aucune', label: 'Sans fond', r: '' },
  ] as const;
  return (
    <div className="o-section-8" role="group" aria-labelledby="t-perso-logo">
      <span id="t-perso-logo" className="o-libelle o-t17">5. Personnaliser</span>
      <label className="o-champ-groupe">
        <span className="o-libelle">Phrase sous le nom <span className="o-facultatif">(facultatif)</span></span>
        <input className="o-champ" value={L.sousTitre ?? ''} maxLength={40} placeholder="Épicerie zéro déchet" onChange={(e) => set({ sousTitre: e.target.value }, 'logo-sous')} />
      </label>
      <label className="o-champ-groupe">
        <span className="o-libelle">Police du logo</span>
        <select className="o-champ" value={L.police ?? ''} style={{ fontFamily: s.police }} onChange={(e) => set({ police: e.target.value || undefined })}>
          <option value="">Celle des titres de ma charte</option>
          {familles.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </label>
      <div className="o-ligne-boutons">
        <button className="o-btn o-btn-secondaire o-bascule" aria-pressed={s.graisse >= 700} onClick={() => set({ graisse: s.graisse >= 700 ? 'normal' : 'gras' })}><strong>G</strong>Gras</button>
        <button className="o-btn o-btn-secondaire o-bascule" aria-pressed={!!L.majuscules} onClick={() => set({ majuscules: !L.majuscules })}>AB Majuscules</button>
      </div>
      {curseur('tailleTexte', 'Taille du texte')}
      {L.mise_en_page !== 'texte' && curseur('tailleSymbole', 'Taille du symbole')}
      <label className="o-curseur">
        <span className="o-libelle">Espacement des lettres <span className="o-facultatif">· {Math.round((L.espacement ?? 0) * 100)}</span></span>
        <input type="range" min={0} max={30} step={1} value={Math.round((L.espacement ?? 0) * 100)} onChange={(e) => set({ espacement: Number(e.target.value) / 100 }, 'logo-esp')} />
      </label>
      {L.mise_en_page !== 'texte' && L.mise_en_page !== 'rond' && (
        <div className="o-champ-groupe" role="group" aria-labelledby="t-forme-logo">
          <span id="t-forme-logo" className="o-libelle">Forme derrière le symbole</span>
          <div className="o-grille-4">
            {formes.map((fo) => (
              <button key={fo.id} className="o-carte-choix o-forme o-forme-logo" aria-pressed={s.forme === fo.id} onClick={() => set({ forme: fo.id })}>
                <span className="o-forme-symbole" style={fo.r ? { borderRadius: fo.r } : { background: 'transparent', color: 'var(--v-texte)' }}>
                  <Icon n={L.symbole ?? 'star'} size={20} />
                </span>
                <span>{fo.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        className="o-btn o-btn-discret o-aligne-gauche"
        onClick={() => set({ sousTitre: undefined, police: undefined, graisse: undefined, majuscules: undefined, espacement: undefined, tailleTexte: undefined, tailleSymbole: undefined, forme: undefined })}
      >
        <Icon n="undo" />Remettre les réglages de départ
      </button>
    </div>
  );
}

/** Télécharger le logo pour l'oral, la maquette 3D ou la maquette en carton. */
function TelechargerLogo() {
  const { projet } = useProjet();
  const [enCours, setEnCours] = useState<TypeTelechargement | null>(null);
  const [fait, setFait] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);
  const charger = async (t: TypeTelechargement) => {
    setEnCours(t); setErreur(false);
    try { setFait(await telechargerLogo(projet, t)); } catch { setErreur(true); } finally { setEnCours(null); }
  };
  const importe = !!projet.logo.image_importee;
  const choix: { t: TypeTelechargement; label: string; aide: string; icon: string }[] = importe
    ? [{ t: 'importe', label: 'Mon logo importé', aide: 'Le fichier de ton équipe', icon: 'image' }]
    : [
      { t: 'png', label: 'Logo (PNG)', aide: 'Fond transparent, haute définition : diaporama, maquette 3D, impression', icon: 'image' },
      { t: 'png-fonce', label: 'Logo sur fond foncé (PNG)', aide: 'Pour une diapositive sombre', icon: 'image' },
      { t: 'symbole', label: 'Symbole seul (PNG carré)', aide: 'Pour une enseigne, un autocollant sur la maquette', icon: 'storefront' },
    ];
  return (
    <div className="o-telecharger-logo">
      <span className="o-t17 o-gras">Télécharger mon logo</span>
      <span className="o-aide">Pour ta présentation orale, ta maquette 3D, ou pour l'imprimer et le coller sur ta maquette en carton.</span>
      <div className="o-grille-2">
        {choix.map((c) => (
          <button key={c.t} className="o-carte-choix o-telechargement" onClick={() => charger(c.t)} disabled={!!enCours}>
            <Icon n={enCours === c.t ? 'sync' : 'download'} className="o-c-action" />
            <span className="o-telechargement-texte"><strong>{c.label}</strong><span>{c.aide}</span></span>
          </button>
        ))}
      </div>
      {fait && !erreur && <div role="status" className="o-ok"><Icon n="check_circle" />«&nbsp;{fait}&nbsp;» est dans ton dossier Téléchargements.</div>}
      {erreur && <span className="o-aide-erreur"><Icon n="error" size={20} />Le téléchargement n'a pas marché. Réessaie.</span>}
    </div>
  );
}

/** Sans accents ni majuscules, pour la recherche. */
const simplifier = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Choix du symbole : catégories, recherche par nom, grille. */
function ChoixSymbole({ valeur, choisir }: { valeur: string | null; choisir: (s: string | null) => void }) {
  const depart = CATEGORIES_SYMBOLES.find((c) => c.symboles.some(([n]) => n === valeur))?.nom ?? CATEGORIES_SYMBOLES[0].nom;
  const [categorie, setCategorie] = useState(depart);
  const [recherche, setRecherche] = useState('');
  const q = simplifier(recherche.trim());
  const liste = q
    ? SYMBOLES.filter((n) => simplifier(NOMS_SYMBOLES[n]).includes(q))
    : categorie === 'Tout' ? SYMBOLES : CATEGORIES_SYMBOLES.find((c) => c.nom === categorie)!.symboles.map(([n]) => n);
  return (
    <div className="o-section-8" role="group" aria-labelledby="t-symbole">
      <span id="t-symbole" className="o-libelle o-t17">2. Un symbole <span className="o-facultatif">· {SYMBOLES.length} au choix</span></span>
      <input
        type="search"
        className="o-champ"
        placeholder="Chercher : fleur, jeu, café, vélo…"
        aria-label="Chercher un symbole"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      {!q && (
        <div className="o-categories" role="group" aria-label="Catégories de symboles">
          {['Tout', ...CATEGORIES_SYMBOLES.map((c) => c.nom)].map((nom) => (
            <button key={nom} className="o-categorie" aria-pressed={categorie === nom} onClick={() => setCategorie(nom)}>{nom}</button>
          ))}
        </div>
      )}
      {liste.length ? (
        <div className="o-grille-symboles">
          {liste.map((n) => (
            <button key={n} className="o-symbole" aria-label={NOMS_SYMBOLES[n]} title={NOMS_SYMBOLES[n]} aria-pressed={valeur === n} onClick={() => choisir(valeur === n ? null : n)}>
              <Icon n={n} size={24} />
            </button>
          ))}
        </div>
      ) : (
        <span className="o-aide">Aucun symbole ne correspond. Essaie un autre mot, ou choisis une catégorie.</span>
      )}
      {valeur && <span className="o-aide">Symbole choisi : <strong className="o-c-texte">{NOMS_SYMBOLES[valeur] ?? valeur}</strong>. Clique-le à nouveau pour l'enlever.</span>}
    </div>
  );
}
