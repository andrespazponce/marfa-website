'use client';
import styles from './PropertyMapSection.module.css';

// ── Coordinate system: viewBox 0 0 1000 806 ──────────────────────────────────
// Source: satellite image 2000×1611 px → divide by 2 for SVG coords.
// Red outline = property boundary · Blue outline = lagoon.

const PROPERTY = `
  M 223,107
  L 248,100 L 278,103 L 330,97  L 382,94
  L 415,93  L 450,92  L 478,86  L 505,73
  L 528,60  L 555,47
  L 578,68  L 584,110 L 580,165
  L 572,220 L 562,270 L 550,308
  L 538,340 L 520,360 L 502,373
  L 488,376 L 471,368 L 458,362
  L 440,368 L 420,383 L 395,405
  L 365,432 L 328,468 L 302,512
  L 289,558 L 285,628 L 284,720 L 284,790
  L 180,790
  L 180,720 L 182,630 L 186,534
  L 190,450 L 195,393 L 203,360
  L 210,335 L 218,305 L 222,278 L 222,260
  L 218,238 L 213,198 L 210,168
  L 208,148 L 210,128 L 218,116 L 223,107 Z
`.trim();

const LAGOON = `
  M 225,260
  L 210,255 L 195,248 L 180,238 L 168,225
  L 160,208 L 158,188 L 158,170
  L 163,155 L 170,143 L 180,135 L 195,128 L 212,122
  L 230,117 L 258,110 L 290,105 L 320,99
  L 352,95  L 382,93  L 410,93  L 430,100 L 450,115
  L 457,133 L 458,160 L 456,184
  L 448,207 L 437,224 L 426,234
  L 413,242 L 399,248 L 386,249 L 374,248 L 363,248
  L 368,252 L 380,260 L 398,268 L 412,276 L 418,290
  L 413,300 L 403,307 L 393,305 L 382,300
  L 372,290 L 365,276 L 360,262 L 357,256
  L 348,254 L 325,253 L 305,255
  L 285,258 L 260,260 L 235,261 L 225,260 Z
`.trim();

// ── Marker positions (placeholder – will be refined after on-site survey) ─────
const MARKERS = [
  { id: 'c1', type: 'bbq', num: '1', label: 'Churrasquero C1', x: 248, y: 375, href: '#asadores' },
  { id: 'c2', type: 'bbq', num: '2', label: 'Churrasquero C2', x: 305, y: 358, href: '#asadores' },
  { id: 'c3', type: 'bbq', num: '3', label: 'Churrasquero C3', x: 363, y: 363, href: '#asadores' },
  { id: 'c4', type: 'bbq', num: '4', label: 'Churrasquero C4', x: 420, y: 356, href: '#asadores' },
  { id: 'c5', type: 'bbq', num: '5', label: 'Churrasquero C5', x: 262, y: 418, href: '#asadores' },
  { id: 'c6', type: 'bbq', num: '6', label: 'Churrasquero C6', x: 322, y: 413, href: '#asadores' },
  { id: 'c7', type: 'bbq', num: '7', label: 'Churrasquero C7', x: 381, y: 416, href: '#asadores' },
  { id: 'camping', type: 'camping', num: null, label: 'Camping VIP', x: 122, y: 325, href: '#camping' },
  { id: 'wc', type: 'wc', num: null, label: 'Servicios', x: 462, y: 402, href: null },
  { id: 'fishing', type: 'fishing', num: null, label: 'Pesca deportiva', x: 162, y: 272, href: null },
  { id: 'entrada', type: 'entrance', num: null, label: 'Entrada MARFA', x: 432, y: 512, href: null },
];

const ICON = {
  bbq:      '🔥',
  camping:  '⛺',
  wc:       '🚿',
  fishing:  '🎣',
  entrance: '🚗',
};

const COLOR = {
  bbq:      '#B8962E',
  camping:  '#2E6B3E',
  wc:       '#3A5A8A',
  fishing:  '#1A7A8A',
  entrance: '#5A4A2E',
};

// ── Tree helper ───────────────────────────────────────────────────────────────
function Tree({ x, y, size = 14 }) {
  const s = size;
  return (
    <g>
      <rect x={x - s * 0.1} y={y + s * 0.5} width={s * 0.2} height={s * 0.6} fill="#8A6030" />
      <circle cx={x - s * 0.35} cy={y + s * 0.2} r={s * 0.42} fill="#2E6B22" />
      <circle cx={x + s * 0.35} cy={y + s * 0.2} r={s * 0.42} fill="#2E6B22" />
      <circle cx={x} cy={y - s * 0.1} r={s * 0.55} fill="#3A8030" />
      <circle cx={x} cy={y - s * 0.3} r={s * 0.35} fill="#4A9038" />
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PropertyMapSection({ data }) {
  return (
    <section className={styles.section} id="property-map">
      <div className={styles.inner}>
        <header className={styles.header}>
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 className="section-headline">
            {data.headline} <em>{data.headline_italic}</em>
          </h2>
          <p className={styles.subline}>{data.subline}</p>
        </header>

        <div className={styles.mapWrap}>
          <svg
            viewBox="0 0 1000 806"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.mapSvg}
            role="img"
            aria-label="Mapa ilustrado de la propiedad MARFA"
          >
            <defs>
              <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A8D080" />
                <stop offset="100%" stopColor="#7AB858" />
              </linearGradient>
              <linearGradient id="propGrad" x1="0.1" y1="0" x2="0.9" y2="1">
                <stop offset="0%" stopColor="#5A9840" />
                <stop offset="60%" stopColor="#488030" />
                <stop offset="100%" stopColor="#3A6825" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0.1" y1="0" x2="0.85" y2="1">
                <stop offset="0%" stopColor="#88D4EE" />
                <stop offset="45%" stopColor="#52BADB" />
                <stop offset="100%" stopColor="#3498BC" />
              </linearGradient>
              <radialGradient id="forestDark" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#245A1A" />
                <stop offset="100%" stopColor="#1A4212" />
              </radialGradient>
              <filter id="propShadow" x="-5%" y="-5%" width="115%" height="115%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00000055" />
              </filter>
              <filter id="lagoonGlow" x="-5%" y="-5%" width="110%" height="110%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b" />
                <feOffset dy="2" in="b" result="ob" />
                <feMerge><feMergeNode in="ob" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* ── Surrounding fields ───────────────────────────────────── */}
            <rect width="1000" height="806" fill="url(#bgGrad)" />
            {[...Array(10)].map((_, i) => (
              <line key={i} x1="0" y1={i * 82} x2="1000" y2={i * 82}
                stroke="#98C870" strokeWidth="0.8" strokeOpacity="0.3" />
            ))}

            {/* ── Property fill ─────────────────────────────────────────── */}
            <path d={PROPERTY} fill="url(#propGrad)" filter="url(#propShadow)" />

            {/* ── Dense forest: upper-right block ──────────────────────── */}
            <ellipse cx="555" cy="192" rx="115" ry="90" fill="url(#forestDark)" opacity="0.93" />
            <ellipse cx="592" cy="262" rx="80"  ry="65" fill="url(#forestDark)" opacity="0.88" />
            <ellipse cx="482" cy="242" rx="46"  ry="38" fill="url(#forestDark)" opacity="0.82" />
            <ellipse cx="542" cy="302" rx="54"  ry="42" fill="url(#forestDark)" opacity="0.78" />

            {/* ── Dense forest: lower section ───────────────────────────── */}
            <ellipse cx="292" cy="598" rx="70"  ry="57" fill="url(#forestDark)" opacity="0.88" />
            <ellipse cx="247" cy="658" rx="52"  ry="47" fill="url(#forestDark)" opacity="0.85" />
            <ellipse cx="312" cy="702" rx="63"  ry="52" fill="url(#forestDark)" opacity="0.90" />
            <ellipse cx="248" cy="758" rx="38"  ry="32" fill="url(#forestDark)" opacity="0.82" />
            <ellipse cx="342" cy="640" rx="45"  ry="38" fill="url(#forestDark)" opacity="0.80" />
            <ellipse cx="440" cy="345" rx="37"  ry="29" fill="url(#forestDark)" opacity="0.72" />

            {/* ── Roads / paths ─────────────────────────────────────────── */}
            <path d="M 232,790 L 232,690 L 230,575 L 226,462 L 223,380 L 220,308 L 219,286"
              fill="none" stroke="#B8A870" strokeWidth="10" strokeLinecap="round" />
            <path d="M 232,790 L 232,690 L 230,575 L 226,462 L 223,380 L 220,308 L 219,286"
              fill="none" stroke="#D4C490" strokeWidth="6" strokeLinecap="round" />
            {/* Left branch */}
            <path d="M 219,286 Q 205,276 192,268 L 185,262"
              fill="none" stroke="#B8A870" strokeWidth="8" strokeLinecap="round" />
            <path d="M 219,286 Q 205,276 192,268 L 185,262"
              fill="none" stroke="#D4C490" strokeWidth="5" strokeLinecap="round" />
            {/* Right branch */}
            <path d="M 219,286 L 220,268"
              fill="none" stroke="#B8A870" strokeWidth="8" strokeLinecap="round" />
            <path d="M 219,286 L 220,268"
              fill="none" stroke="#D4C490" strokeWidth="5" strokeLinecap="round" />

            {/* ── Lagoon ────────────────────────────────────────────────── */}
            <path d={LAGOON} fill="url(#waterGrad)" filter="url(#lagoonGlow)" />

            {/* Water shimmer */}
            <g opacity="0.55" strokeLinecap="round">
              <path d="M 185,200 Q 252,188 322,188 Q 374,188 404,200"
                fill="none" stroke="#D0EEFF" strokeWidth="2.5" />
              <path d="M 174,218 Q 236,206 298,208"
                fill="none" stroke="#D0EEFF" strokeWidth="1.8" />
              <path d="M 248,240 Q 308,228 367,232"
                fill="none" stroke="#D0EEFF" strokeWidth="1.5" />
              <path d="M 288,120 Q 358,112 424,122"
                fill="none" stroke="#D0EEFF" strokeWidth="1.5" />
              <path d="M 395,270 Q 406,280 410,294"
                fill="none" stroke="#D0EEFF" strokeWidth="1.5" />
            </g>

            {/* Shoreline */}
            <path d={LAGOON} fill="none" stroke="#2888AA" strokeWidth="1.8" strokeOpacity="0.6" />

            {/* ── Shore trees ───────────────────────────────────────────── */}
            <Tree x={170} y={175} size={12} />
            <Tree x={158} y={215} size={10} />
            <Tree x={166} y={246} size={11} />
            <Tree x={210} y={263} size={10} />
            <Tree x={398} y={108} size={11} />
            <Tree x={448} y={120} size={10} />
            <Tree x={218} y={110} size={12} />
            <Tree x={334} y={95}  size={10} />
            <Tree x={432} y={257} size={11} />
            <Tree x={370} y={256} size={10} />
            <Tree x={462} y={130} size={9}  />

            {/* ── Property boundary dashed line ────────────────────────── */}
            <path d={PROPERTY} fill="none"
              stroke="#CC4015" strokeWidth="3"
              strokeDasharray="10,5" strokeLinecap="round" opacity="0.88" />

            {/* ── Lagoon label ──────────────────────────────────────────── */}
            <text x="308" y="174" textAnchor="middle"
              fill="#1868A0" fontSize="13" fontFamily="Georgia, serif"
              fontStyle="italic" fontWeight="bold" opacity="0.82">
              Laguna MARFA
            </text>

            {/* ── Compass rose ──────────────────────────────────────────── */}
            <g transform="translate(945,65)">
              <circle r="24" fill="white" fillOpacity="0.14"
                stroke="white" strokeOpacity="0.32" strokeWidth="1.5" />
              <text textAnchor="middle" y="-10" fill="white"
                fontSize="9" fontWeight="bold" opacity="0.72" fontFamily="sans-serif">N</text>
              <path d="M 0,-18 L 4,-5 L 0,0 L -4,-5 Z" fill="white" opacity="0.72" />
              <path d="M 0,18 L 4,5 L 0,0 L -4,5 Z"   fill="white" opacity="0.28" />
              <path d="M -18,0 L -5,4 L 0,0 L -5,-4 Z" fill="white" opacity="0.28" />
              <path d="M  18,0 L  5,4 L 0,0 L  5,-4 Z" fill="white" opacity="0.28" />
            </g>

            {/* ── Scale label ───────────────────────────────────────────── */}
            <g transform="translate(42,762)">
              <rect width="116" height="22" rx="4" fill="#1A1A1A" fillOpacity="0.55" />
              <text x="58" textAnchor="middle" y="15" fill="#E8E4DC"
                fontSize="9" fontFamily="sans-serif" letterSpacing="1.5" fontWeight="300">
                19 HECTÁREAS
              </text>
            </g>

            {/* ── Coming-soon badge ─────────────────────────────────────── */}
            <g transform="translate(490,500)">
              <rect x="-115" y="-20" width="230" height="40" rx="20"
                fill="#1A1A1A" fillOpacity="0.62" />
              <text textAnchor="middle" y="6" fill="#C9A96E"
                fontSize="10.5" fontFamily="Georgia, serif" letterSpacing="2.5">
                PUNTOS POR AÑADIR
              </text>
            </g>

          </svg>
        </div>

        <p className={styles.mapNote}>
          Los puntos de interés (churrasqueros C1–C7, baños y camping) se añadirán al mapa pronto.
        </p>
      </div>
    </section>
  );
}
