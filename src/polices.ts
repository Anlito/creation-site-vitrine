// Polices embarquées (aucune connexion nécessaire) : Atkinson Hyperlegible pour l'outil,
// et les 15 polices proposées aux élèves pour leur site. Sous-ensemble « latin » (accents français compris).
import atk400 from '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2?url';
import atk700 from '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2?url';
import isr400 from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url';
import isa400 from '@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff2?url';
import isa700 from '@fontsource/instrument-sans/files/instrument-sans-latin-700-normal.woff2?url';
import bal800 from '@fontsource/baloo-2/files/baloo-2-latin-800-normal.woff2?url';
import nun400 from '@fontsource/nunito/files/nunito-latin-400-normal.woff2?url';
import nun700 from '@fontsource/nunito/files/nunito-latin-700-normal.woff2?url';
import cha700 from '@fontsource/chakra-petch/files/chakra-petch-latin-700-normal.woff2?url';
import arc400 from '@fontsource/archivo/files/archivo-latin-400-normal.woff2?url';
import arc700 from '@fontsource/archivo/files/archivo-latin-700-normal.woff2?url';
import bri700 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2?url';
import lit400 from '@fontsource/literata/files/literata-latin-400-normal.woff2?url';
import lit700 from '@fontsource/literata/files/literata-latin-700-normal.woff2?url';
import lex400 from '@fontsource/lexend/files/lexend-latin-400-normal.woff2?url';
import lex700 from '@fontsource/lexend/files/lexend-latin-700-normal.woff2?url';
import bre400 from '@fontsource/bree-serif/files/bree-serif-latin-400-normal.woff2?url';
import sss400 from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2?url';
import sss700 from '@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff2?url';
import pac400 from '@fontsource/pacifico/files/pacifico-latin-400-normal.woff2?url';
import qui400 from '@fontsource/quicksand/files/quicksand-latin-400-normal.woff2?url';
import qui700 from '@fontsource/quicksand/files/quicksand-latin-700-normal.woff2?url';
import spm700 from '@fontsource/space-mono/files/space-mono-latin-700-normal.woff2?url';
import wrk400 from '@fontsource/work-sans/files/work-sans-latin-400-normal.woff2?url';
import wrk700 from '@fontsource/work-sans/files/work-sans-latin-700-normal.woff2?url';
import { policesDe, type Charte } from './model';

export interface FichierPolice { famille: string; graisse: number; url: string; fichier: string }

const f = (famille: string, graisse: number, url: string): FichierPolice => ({
  famille, graisse, url, fichier: `${famille.toLowerCase().replace(/\s+/g, '-')}-${graisse}.woff2`,
});

export const POLICE_OUTIL = [f('Atkinson Hyperlegible', 400, atk400), f('Atkinson Hyperlegible', 700, atk700)];

export const POLICES_SITE: FichierPolice[] = [
  f('Instrument Serif', 400, isr400), f('Instrument Sans', 400, isa400), f('Instrument Sans', 700, isa700),
  f('Baloo 2', 800, bal800), f('Nunito', 400, nun400), f('Nunito', 700, nun700),
  f('Chakra Petch', 700, cha700), f('Archivo', 400, arc400), f('Archivo', 700, arc700),
  f('Bricolage Grotesque', 700, bri700), f('Literata', 400, lit400), f('Literata', 700, lit700),
  f('Lexend', 400, lex400), f('Lexend', 700, lex700),
  f('Bree Serif', 400, bre400), f('Source Sans 3', 400, sss400), f('Source Sans 3', 700, sss700),
  f('Pacifico', 400, pac400), f('Quicksand', 400, qui400), f('Quicksand', 700, qui700),
  f('Space Mono', 700, spm700), f('Work Sans', 400, wrk400), f('Work Sans', 700, wrk700),
];

export function fontFace(p: FichierPolice, url = p.url) {
  return `@font-face{font-family:'${p.famille}';font-style:normal;font-weight:${p.graisse};font-display:swap;src:url("${url}") format("woff2")}`;
}

const familleDe = (css: string) => css.match(/'([^']+)'/)?.[1] ?? '';

/** Familles proposées dans « Mes polices » (en plus des polices importées). */
export const FAMILLES_INTEGREES = [...new Set(POLICES_SITE.map((p) => p.famille))];

/** Fichiers de police intégrés nécessaires pour la charte (titre + texte). */
export function fichiersPourPaire(c: Charte): FichierPolice[] {
  const pol = policesDe(c);
  const fams = new Set([familleDe(pol.titre), familleDe(pol.texte)]);
  return POLICES_SITE.filter((x) => fams.has(x.famille));
}

/** Installe dans l'outil les polices importées par l'élève (mises à jour à chaque changement). */
export function installerPolicesImportees(c: Charte | undefined) {
  let style = document.getElementById('polices-importees');
  if (!style) { style = document.createElement('style'); style.id = 'polices-importees'; document.head.appendChild(style); }
  style.textContent = (c?.policesImportees ?? [])
    .map((f) => `@font-face{font-family:'${f.famille}';font-weight:100 900;font-display:swap;src:url("${f.donnees}") format("${f.format}")}`)
    .join('\n');
}

/** Installe toutes les polices dans la page de l'outil. */
export function installerPolices() {
  const style = document.createElement('style');
  style.textContent = [...POLICE_OUTIL, ...POLICES_SITE].map((p) => fontFace(p)).join('\n');
  document.head.appendChild(style);
}
