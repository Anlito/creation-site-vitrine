import { useEffect } from 'react';
import { FournisseurApp, useApp } from './etat';
import { installerPolicesImportees } from './polices';
import { Accueil } from './screens/Accueil';
import { Charte } from './screens/Charte';
import { Controle } from './screens/Controle';
import { Editeur } from './screens/Editeur';
import { Enseignant } from './screens/Enseignant';
import { Demarrer, Nommer } from './screens/Nommer';
import { Structure } from './screens/Structure';

function Ecrans() {
  const { ecran, etape, projet } = useApp();
  const importees = projet?.charte.policesImportees;
  // Les polices importées par l'élève sont ajoutées à la page de l'outil.
  useEffect(() => installerPolicesImportees(projet?.charte), [importees]);
  if (ecran === 'enseignant') return <Enseignant />;
  if (ecran === 'nommer') return <Nommer />;
  if (ecran === 'accueil' || !projet) return <Accueil />;
  switch (etape) {
    case 1: return <Demarrer />;
    case 2: return <Charte />;
    case 3: return <Structure />;
    case 4: return <Editeur />;
    default: return <Controle />;
  }
}

export function App() {
  return (
    <FournisseurApp>
      <Ecrans />
    </FournisseurApp>
  );
}
