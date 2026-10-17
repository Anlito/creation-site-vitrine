// Fabrique le livrable à déposer sur le serveur de chaque classe :
// livrables/Vitrine-vX.Y.Z/ (dossier prêt à copier) et livrables/Vitrine-vX.Y.Z.zip.
// À lancer après « npm run build » (ou directement : « npm run livrable »).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const racine = fileURLToPath(new URL('..', import.meta.url));
const { version } = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf8'));
const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const nom = `Vitrine-v${version}`;
const sortie = join(racine, 'livrables', nom);

const outil = join(racine, 'dist', 'index.html');
if (!existsSync(outil)) throw new Error('dist/index.html manquant : lancer d\'abord « npm run build ».');

rmSync(sortie, { recursive: true, force: true });
mkdirSync(join(sortie, 'Vitrine'), { recursive: true });
cpSync(outil, join(sortie, 'Vitrine', 'index.html'));
// Copie de secours des réglages du collège (liste des classes, chemin), lue par l'outil à côté de index.html.
cpSync(join(racine, 'dist', 'college.js'), join(sortie, 'Vitrine', 'college.js'));
for (const f of readdirSync(join(racine, 'livraison'))) {
  const texte = readFileSync(join(racine, 'livraison', f), 'utf8').replaceAll('{{VERSION}}', version).replaceAll('{{DATE}}', date);
  writeFileSync(join(sortie, f), texte);
}

// Archive zip (le dossier « Vitrine-vX.Y.Z » à la racine du zip).
const fichiers = {};
const parcourir = (dossier) => {
  for (const f of readdirSync(dossier)) {
    const chemin = join(dossier, f);
    if (statSync(chemin).isDirectory()) parcourir(chemin);
    else fichiers[`${nom}/${relative(sortie, chemin).split(sep).join('/')}`] = readFileSync(chemin);
  }
};
parcourir(sortie);
writeFileSync(join(racine, 'livrables', `${nom}.zip`), zipSync(fichiers, { level: 9 }));
console.log(`Livrable prêt : livrables/${nom}/ et livrables/${nom}.zip`);
