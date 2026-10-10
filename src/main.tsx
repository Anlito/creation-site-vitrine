import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installerPolices } from './polices';
import './site/site.css';
import './outil.css';

installerPolices();
createRoot(document.getElementById('app')!).render(<App />);
