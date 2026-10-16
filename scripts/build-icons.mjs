// Génère src/icons.gen.ts : les pictogrammes Material Symbols Rounded utilisés par l'outil,
// en tracés SVG (aucune police d'icônes à charger, et réutilisables tels quels dans l'export).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const dir = join(dirname(require.resolve('@material-symbols/svg-400/package.json')), 'rounded');

const NAMES = [
  // Interface
  'check', 'save', 'arrow_forward', 'arrow_back', 'add_circle', 'folder_open', 'error', 'warning', 'auto_fix_high',
  'check_circle', 'sync', 'upload', 'close', 'drag_indicator', 'lock', 'arrow_upward', 'arrow_downward', 'add',
  'computer', 'smartphone', 'undo', 'palette', 'lightbulb', 'south', 'add_box', 'content_copy', 'delete',
  'ads_click', 'compress', 'open_in_new', 'cancel', 'task_alt', 'public', 'download', 'table_view', 'menu', 'info',
  'location_on', 'schedule', 'chevron_right', 'edit', 'visibility', 'image',
  // Blocs
  'panorama', 'title', 'notes', 'format_list_bulleted', 'smart_button', 'photo_library',
  // Symboles du logo
  'eco', 'local_florist', 'potted_plant', 'park', 'spa', 'recycling', 'sports_esports', 'toys', 'brush',
  'music_note', 'headphones', 'menu_book', 'local_cafe', 'cake', 'icecream', 'restaurant', 'shopping_bag',
  'storefront', 'redeem', 'checkroom', 'diamond', 'favorite', 'star', 'bolt', 'rocket_launch', 'pets',
  'skateboarding', 'photo_camera', 'sunny',
  // Site
  'pin_drop', 'shopping_basket',
  // Nouveaux blocs, modèles, aperçu
  'format_quote', 'horizontal_rule', 'mail', 'dashboard', 'grid_view', 'view_column', 'calendar_month', 'groups', 'event',
  'person', 'inventory_2', 'agriculture', 'payments', 'view_agenda', 'fullscreen', 'close_fullscreen', 'web', 'view_quilt',
  'call', 'contact_mail', 'splitscreen',
  // Onglets, sous-pages
  'badge', 'account_tree', 'subdirectory_arrow_right', 'expand_more', 'right_panel_close', 'right_panel_open', 'tune',
  'format_align_left', 'format_align_center', 'format_align_right',
];

// Noms renommés dans les versions récentes de la bibliothèque.
const ALIASES = { smartphone: 'mobile', smart_button: 'buttons_alt', auto_fix_high: 'wand_stars', expand_more: 'keyboard_arrow_down' };

// Tous les symboles du logo, lus dans la liste partagée avec l'outil.
const symboles = JSON.parse(readFileSync(new URL('../src/data/symboles.json', import.meta.url), 'utf8'));
for (const c of symboles.categories) for (const [n] of c.symboles) NAMES.push(n);

const out = {};
for (const n of [...new Set(NAMES)]) {
  const svg = readFileSync(join(dir, `${ALIASES[n] ?? n}.svg`), 'utf8');
  const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
  if (!paths.length) throw new Error(`Pictogramme sans tracé : ${n}`);
  out[n] = paths.join(' ');
}
writeFileSync(
  new URL('../src/icons.gen.ts', import.meta.url),
  '// Généré par scripts/build-icons.mjs — ne pas modifier à la main.\n' +
    '// Material Symbols Rounded (Google, licence Apache 2.0), viewBox "0 -960 960 960".\n' +
    `export const ICONS: Record<string, string> = ${JSON.stringify(out, null, 0).replace(/","/g, '",\n  "')};\n`,
);
console.log(`${Object.keys(out).length} pictogrammes écrits dans src/icons.gen.ts`);
