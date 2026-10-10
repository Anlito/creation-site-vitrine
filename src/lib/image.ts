// Préparation des images importées : les images de plus de 1 Mo sont réduites côté navigateur.
import { LIMITE_IMAGE } from '../data/constantes';

export interface ImageLue { src: string; nom: string; avant: number; apres: number; reduite: boolean }

const lireDataUrl = (f: Blob) => new Promise<string>((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok(r.result as string);
  r.onerror = () => ko(r.error);
  r.readAsDataURL(f);
});

const chargerImage = (src: string) => new Promise<HTMLImageElement>((ok, ko) => {
  const i = new Image();
  i.onload = () => ok(i);
  i.onerror = () => ko(new Error('image illisible'));
  i.src = src;
});

export const poidsDataUrl = (d: string) => Math.round((d.length - d.indexOf(',') - 1) * 0.75);

/** Lit une image ; au-delà de 1 Mo, la ramène à 1600 px de large en JPEG (qualité 0,8). */
export async function preparerImage(f: File): Promise<ImageLue> {
  const brut = await lireDataUrl(f);
  if (f.size <= LIMITE_IMAGE) return { src: brut, nom: f.name, avant: f.size, apres: f.size, reduite: false };
  const img = await chargerImage(brut);
  let largeur = Math.min(1600, img.naturalWidth);
  let qualite = 0.8;
  let src = brut;
  for (let essai = 0; essai < 6; essai++) {
    const h = Math.round(img.naturalHeight * (largeur / img.naturalWidth));
    const c = document.createElement('canvas');
    c.width = largeur;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF'; // les zones transparentes deviennent blanches en JPEG
    ctx.fillRect(0, 0, largeur, h);
    ctx.drawImage(img, 0, 0, largeur, h);
    src = c.toDataURL('image/jpeg', qualite);
    if (poidsDataUrl(src) <= LIMITE_IMAGE) break;
    largeur = Math.round(largeur * 0.8);
    qualite = Math.max(0.6, qualite - 0.05);
  }
  return { src, nom: f.name.replace(/\.[^.]+$/, '') + '.jpg', avant: f.size, apres: poidsDataUrl(src), reduite: true };
}

/** « 8,4 Mo », « 420 Ko » */
export function poidsLisible(o: number) {
  if (o >= 1024 * 1024) return `${(o / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
  return `${Math.max(1, Math.round(o / 1024)).toLocaleString('fr-FR')} Ko`;
}
