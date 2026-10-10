// Mot de passe de l'espace enseignant.
// L'outil fonctionne sans serveur : ce verrou empêche les élèves d'entrer par erreur ou par curiosité,
// mais ce n'est pas une protection forte. Seule l'empreinte du mot de passe est écrite dans le fichier.
// Pour changer le mot de passe : calculer sha256("vitrine:" + nouveau mot de passe) et remplacer EMPREINTE.
const EMPREINTE = '0c7f481a4f06fbc60a483ac42addd1a608ec42c4a46781138f9d8009bdef5a22';

/** SHA-256 en JavaScript pur (marche aussi quand la page est ouverte depuis un fichier local). */
function sha256(texte: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const octets = new TextEncoder().encode(texte);
  const longueur = Math.ceil((octets.length + 9) / 64) * 64;
  const m = new Uint8Array(longueur);
  m.set(octets);
  m[octets.length] = 0x80;
  new DataView(m.buffer).setUint32(longueur - 4, octets.length * 8);
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Uint32Array(64);
  const rot = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const vue = new DataView(m.buffer);
  for (let i = 0; i < longueur; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = vue.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rot(w[t - 15], 7) ^ rot(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rot(w[t - 2], 17) ^ rot(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, k] = h;
    for (let t = 0; t < 64; t++) {
      const t1 = (k + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) | 0;
      const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, k].forEach((v, j) => { h[j] = (h[j] + v) | 0; });
  }
  return h.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

/** Reste ouvert jusqu'au rechargement de la page. */
let deverrouille = false;

export const espaceEnseignantOuvert = () => deverrouille;

export function essayerMotDePasse(mot: string): boolean {
  deverrouille = sha256(`vitrine:${mot.trim()}`) === EMPREINTE;
  return deverrouille;
}

export const verrouillerEspaceEnseignant = () => { deverrouille = false; };
