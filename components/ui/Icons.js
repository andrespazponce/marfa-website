/**
 * Icons — set de íconos SVG en línea, estilo minimalista (stroke, sin
 * relleno), pensado para reemplazar los emojis del sitio por algo más
 * profesional y consistente con el diseño de MARFA.
 *
 * Heredan tamaño de `font-size` (width/height: 1em) y color de `color`
 * (stroke: currentColor) del elemento que los envuelve — se controlan
 * igual que un carácter de texto, sin necesidad de props por instancia.
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '1em',
  height: '1em',
  'aria-hidden': 'true',
};

export function IconSunrise(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17 18a5 5 0 0 0-10 0" />
      <line x1="12" y1="9" x2="12" y2="2" />
      <line x1="4.2" y1="10.2" x2="5.6" y2="11.6" />
      <line x1="1" y1="18" x2="3" y2="18" />
      <line x1="21" y1="18" x2="23" y2="18" />
      <line x1="18.4" y1="11.6" x2="19.8" y2="10.2" />
      <line x1="1" y1="22" x2="23" y2="22" />
      <polyline points="8 6 12 2 16 6" />
    </svg>
  );
}

export function IconFlame(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2c2 3 5 6 5 10a5 5 0 1 1-10 0c0-1 .3-2 .8-2.8.4 1.4 1.6 2.3 2.7 1.8-.7-1.6-.6-3.6.5-5C11.6 5 12 3.5 12 2z" />
    </svg>
  );
}

export function IconTent(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20L12 4l8 16" />
      <path d="M9.2 20l2.8-5.5 2.8 5.5" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

export function IconSparkles(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 15l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z" />
    </svg>
  );
}

export function IconUser(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconChevronDown(props) {
  return (
    <svg {...base} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function IconChevronLeft(props) {
  return (
    <svg {...base} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function IconChevronRight(props) {
  return (
    <svg {...base} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function IconWaves(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
      <path d="M2 18c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
    </svg>
  );
}

export function IconMapPin(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconLeaf(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 21c8 0 14-6 14-14V4h-3C8 4 5 10 5 18v3z" />
      <path d="M5 21c4-4 8-8 14-14" />
    </svg>
  );
}
