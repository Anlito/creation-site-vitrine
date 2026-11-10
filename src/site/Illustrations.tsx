/* Illustrations de l'aperçu de la charte graphique, quand l'équipe n'a pas encore mis de photos :
   une boutique et trois produits, dessinés aux couleurs de la charte (variables --pri, --acc, --surf…),
   pour voir tout de suite l'effet des coins des images. Aucune image externe. */

const cadre = { width: '100%', height: '100%', display: 'block' } as const;

/** Intérieur de boutique : comptoir, étagères, plante, vitrine. */
export function IllustrationBoutique() {
  return (
    <svg viewBox="0 0 640 260" preserveAspectRatio="xMidYMid slice" style={cadre} aria-hidden="true">
      <rect width="640" height="260" fill="var(--surf)" />
      <rect y="196" width="640" height="64" fill="var(--line)" />
      <rect x="40" y="36" width="170" height="130" rx="6" fill="var(--bg)" stroke="var(--line)" strokeWidth="4" />
      <path d="M125 36v130M40 101h170" stroke="var(--line)" strokeWidth="4" />
      <rect x="250" y="40" width="150" height="10" rx="3" fill="var(--pri)" opacity=".85" />
      <rect x="250" y="94" width="150" height="10" rx="3" fill="var(--pri)" opacity=".85" />
      <rect x="250" y="148" width="150" height="10" rx="3" fill="var(--pri)" opacity=".85" />
      <rect x="262" y="14" width="26" height="26" rx="5" fill="var(--acc)" /><rect x="296" y="22" width="20" height="18" rx="4" fill="var(--ink)" opacity=".7" /><circle cx="350" cy="28" r="12" fill="var(--acc)" opacity=".7" />
      <rect x="262" y="66" width="18" height="28" rx="4" fill="var(--ink)" opacity=".6" /><rect x="288" y="62" width="30" height="32" rx="5" fill="var(--acc)" /><rect x="330" y="72" width="40" height="22" rx="5" fill="var(--pri)" opacity=".55" />
      <rect x="266" y="122" width="36" height="26" rx="5" fill="var(--acc)" opacity=".75" /><circle cx="330" cy="134" r="14" fill="var(--ink)" opacity=".55" /><rect x="352" y="116" width="26" height="32" rx="5" fill="var(--acc)" />
      <rect x="430" y="132" width="170" height="68" rx="8" fill="var(--pri)" />
      <rect x="430" y="124" width="170" height="14" rx="5" fill="var(--ink)" opacity=".75" />
      <rect x="470" y="98" width="40" height="28" rx="4" fill="var(--ink)" opacity=".8" />
      <rect x="575" y="58" width="34" height="74" rx="17" fill="var(--acc)" opacity=".35" />
      <path d="M592 132v-64" stroke="var(--ink)" strokeWidth="3" opacity=".5" />
      <rect x="70" y="188" width="44" height="22" rx="4" fill="var(--acc)" />
      <path d="M92 188c-24-20-30-46-8-62 6 22 14 34 8 62zm0 0c22-22 30-44 10-62-8 22-14 36-10 62z" fill="var(--pri)" opacity=".8" />
    </svg>
  );
}

/** Trois « photos » de produits différentes (sac, pot, carnet). */
export function IllustrationProduit({ n }: { n: number }) {
  const fond = ['var(--acc)', 'var(--pri)', 'var(--line)'][n % 3];
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" style={cadre} aria-hidden="true">
      <rect width="200" height="120" fill={fond} opacity={n % 3 === 2 ? 1 : 0.28} />
      <ellipse cx="100" cy="104" rx="56" ry="7" fill="var(--ink)" opacity=".12" />
      {n % 3 === 0 && (<>
        <path d="M80 44a20 20 0 0 1 40 0" fill="none" stroke="var(--ink)" strokeWidth="5" opacity=".7" />
        <rect x="64" y="44" width="72" height="58" rx="8" fill="var(--pri)" />
        <rect x="80" y="62" width="40" height="8" rx="4" fill="var(--bg)" opacity=".85" />
      </>)}
      {n % 3 === 1 && (<>
        <rect x="74" y="66" width="52" height="38" rx="8" fill="var(--acc)" />
        <path d="M100 66c-22-14-26-36-6-46 4 18 10 28 6 46zm0 0c20-16 26-34 8-46-6 16-12 30-8 46z" fill="var(--pri)" />
      </>)}
      {n % 3 === 2 && (<>
        <rect x="62" y="30" width="62" height="74" rx="5" fill="var(--acc)" transform="rotate(-8 93 67)" />
        <rect x="80" y="26" width="62" height="78" rx="5" fill="var(--pri)" />
        <path d="M92 46h38M92 58h38M92 70h26" stroke="var(--bg)" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      </>)}
    </svg>
  );
}
