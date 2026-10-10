import { ICONS } from '../icons.gen';

/** Pictogramme Material Symbols Rounded en SVG. Toujours décoratif : le texte voisin porte le sens. */
export function Icon({ n, size = 22, className, style }: { n: string; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className ? `ic ${className}` : 'ic'}
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      style={style}
    >
      <path d={ICONS[n] ?? ''} />
    </svg>
  );
}
