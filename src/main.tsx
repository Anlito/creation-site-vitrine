import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installerPolices } from './polices';
import { chargerCollege } from './lib/college';
import './site/site.css';
import './outil.css';

installerPolices();
chargerCollege();
createRoot(document.getElementById('app')!).render(<App />);
