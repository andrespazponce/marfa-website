'use client';
import { useState } from 'react';
import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './PropertyMapSection.module.css';

// ── Marker positions ──────────────────────────────────────────────────────────
// Coordinates in the 900×560 SVG space. Update after on-site survey.
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
function Tree({ x, y, r }) {
  return (
    <g>
      <circle cx={x + r * 0.08} cy={y + r * 0.12} r={r} fill="rgba(0,0,0,0.15)" />
      <circle cx={x} cy={y} r={r} fill="#3D8040" />
      <circle cx={x} cy={y} r={r * 0.72} fill="#4E9E52" />
      <circle cx={x - r * 0.14} cy={y - r * 0.18} r={r * 0.3} fill="rgba(255,255,255,0.12)" />
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PropertyMapSection({ data }) {
  const [active, setActive] = useState(null);

  return (
    <section className={styles.section} id="property-map" aria-labelledby="map-heading">
      <div className={styles.container}>

        {/* Header */}
        <RevealWrapper direction="up" className={styles.header}>
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 id="map-heading" className="section-headline">
            {data.headline} <em>{data.headline_italic}</em>
          </h2>
          <p className={styles.subline}>{data.subline}</p>
        </RevealWrapper>

        {/* Map */}
        <RevealWrapper direction="up" delay={150} className={styles.mapOuter}>
          <div className={styles.mapInner}>
            <svg
              viewBox="0 0 900 560"
              className={styles.svg}
              aria-label="Mapa ilustrado de la propiedad MARFA"
              role="img"
            >
              <defs>
                <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#8DC55E" />
                  <stop offset="100%" stopColor="#6FAA40" />
                </linearGradient>
                <radialGradient id="lagoonGrad" cx="45%" cy="40%" r="58%">
                  <stop offset="0%"   stopColor="#9DDAF5" />
                  <stop offset="55%"  stopColor="#58B4D8" />
                  <stop offset="100%" stopColor="#3A8EBB" />
                </radialGradient>
                <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#C4A265" />
                  <stop offset="100%" stopColor="#D8B87A" />
                </linearGradient>
                <filter id="mapShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* ── 1. Grass base ─────────────────────────────────────────── */}
              <rect x="0" y="0" width="900" height="560" fill="url(#grassGrad)" />

              {/* ── 2. Roads / paths ──────────────────────────────────────── */}
              {/* Main entry road */}
              <path d="M 432,560 L 432,480 C 432,462 425,448 415,438"
                stroke="#B8924E" strokeWidth="16" fill="none" strokeLinecap="round" />
              <path d="M 432,560 L 432,480 C 432,462 425,448 415,438"
                stroke="#D4B070" strokeWidth="11" fill="none" strokeLinecap="round" />
              <path d="M 432,560 L 432,480 C 432,462 425,448 415,438"
                stroke="#E8CC90" strokeWidth="2.5" fill="none" strokeLinecap="round"
                strokeDasharray="10,9" />

              {/* Path to churrasquero cluster */}
              <path d="M 412,435 C 395,425 370,410 340,395 C 310,382 285,378 260,378"
                stroke="#B8924E" strokeWidth="10" fill="none" strokeLinecap="round" />
              <path d="M 412,435 C 395,425 370,410 340,395 C 310,382 285,378 260,378"
                stroke="#D4B070" strokeWidth="7" fill="none" strokeLinecap="round" />

              {/* Path to camping (softer, dashed) */}
              <path d="M 290,390 C 240,370 185,352 132,332"
                stroke="#C4B080" strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray="7,6" opacity="0.75" />

              {/* Path to fishing dock */}
              <path d="M 134,330 C 140,305 148,280 162,268"
                stroke="#C4B080" strokeWidth="5" fill="none" strokeLinecap="round"
                strokeDasharray="5,5" opacity="0.6" />

              {/* Path to WC */}
              <path d="M 412,438 C 430,435 448,422 460,410"
                stroke="#B8924E" strokeWidth="7" fill="none" strokeLinecap="round" />
              <path d="M 412,438 C 430,435 448,422 460,410"
                stroke="#D4B070" strokeWidth="4.5" fill="none" strokeLinecap="round" />

              {/* ── 3. Lagoon ─────────────────────────────────────────────── */}
              <path
                d="M 228,140
                   C 212,106 220,70 252,50
                   C 284,30 348,26 410,44
                   C 472,62 526,98 532,152
                   C 538,206 510,252 470,272
                   C 440,288 396,302 354,296
                   C 304,288 258,264 232,236
                   C 206,208 208,170 218,150
                   C 222,145 225,142 228,140 Z"
                fill="url(#lagoonGrad)"
                stroke="#6EB8D8"
                strokeWidth="2"
              />

              {/* Lagoon highlight / shore shimmer */}
              <path
                d="M 228,140
                   C 212,106 220,70 252,50
                   C 284,30 348,26 410,44
                   C 472,62 526,98 532,152
                   C 538,206 510,252 470,272
                   C 440,288 396,302 354,296
                   C 304,288 258,264 232,236
                   C 206,208 208,170 218,150
                   C 222,145 225,142 228,140 Z"
                fill="none"
                stroke="rgba(200,240,255,0.45)"
                strokeWidth="7"
              />

              {/* Water ripples */}
              <ellipse cx="355" cy="150" rx="45" ry="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
              <ellipse cx="388" cy="185" rx="30" ry="11" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
              <ellipse cx="310" cy="195" rx="35" ry="13" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
              <ellipse cx="445" cy="140" rx="22" ry="8"  fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
              <ellipse cx="275" cy="175" rx="18" ry="7"  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

              {/* Lagoon label */}
              <text
                x="368" y="165"
                textAnchor="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontSize="14"
                fontStyle="italic"
                fill="rgba(255,255,255,0.88)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                Laguna MARFA
              </text>

              {/* Fishing dock */}
              <rect x="152" y="252" width="6" height="22" fill="#7A5C2A" rx="2" />
              <rect x="148" y="250" width="14" height="4"  fill="#9A7535" rx="1" />
              <rect x="156" y="245" width="14" height="3"  fill="#9A7535" rx="1" opacity="0.6" />

              {/* ── 4. Forests ────────────────────────────────────────────── */}
              {/* Right dense forest */}
              <Tree x={598} y={55}  r={55} />
              <Tree x={670} y={45}  r={62} />
              <Tree x={748} y={52}  r={58} />
              <Tree x={820} y={42}  r={52} />
              <Tree x={870} y={60}  r={48} />
              <Tree x={625} y={130} r={60} />
              <Tree x={705} y={122} r={65} />
              <Tree x={785} y={130} r={60} />
              <Tree x={852} y={125} r={54} />
              <Tree x={610} y={208} r={62} />
              <Tree x={688} y={200} r={68} />
              <Tree x={765} y={212} r={62} />
              <Tree x={840} y={208} r={56} />
              <Tree x={888} y={180} r={45} />
              <Tree x={618} y={290} r={60} />
              <Tree x={695} y={285} r={65} />
              <Tree x={772} y={295} r={60} />
              <Tree x={848} y={290} r={54} />
              <Tree x={888} y={268} r={46} />
              <Tree x={630} y={370} r={58} />
              <Tree x={706} y={365} r={64} />
              <Tree x={780} y={375} r={58} />
              <Tree x={852} y={370} r={52} />
              <Tree x={638} y={448} r={55} />
              <Tree x={712} y={445} r={60} />
              <Tree x={786} y={455} r={55} />
              <Tree x={855} y={448} r={50} />

              {/* Upper-left corner small forest patch */}
              <Tree x={42}  y={48}  r={40} />
              <Tree x={95}  y={38}  r={45} />
              <Tree x={148} y={44}  r={42} />
              <Tree x={58}  y={102} r={38} />
              <Tree x={105} y={96}  r={44} />

              {/* Left-side scattered trees */}
              <Tree x={50}  y={200} r={36} />
              <Tree x={38}  y={280} r={34} />
              <Tree x={55}  y={360} r={38} />
              <Tree x={42}  y={440} r={36} />

              {/* Lower-right scattered trees */}
              <Tree x={580} y={490} r={42} />
              <Tree x={650} y={510} r={46} />
              <Tree x={725} y={505} r={42} />
              <Tree x={800} y={515} r={40} />
              <Tree x={865} y={510} r={36} />

              {/* ── 5. BBQ / Churrasquero shelter icons ───────────────────── */}
              {/* Small wooden shelter rectangles behind churrasquero markers */}
              {[
                [248, 375], [305, 358], [363, 363], [420, 356],
                [262, 418], [322, 413], [381, 416],
              ].map(([x, y], i) => (
                <rect
                  key={i}
                  x={x - 12} y={y - 8}
                  width={24} height={18}
                  rx={3}
                  fill="#7A5C2A"
                  opacity={0.4}
                />
              ))}

              {/* ── 6. Markers ────────────────────────────────────────────── */}
              {MARKERS.map(m => (
                <g
                  key={m.id}
                  className={styles.markerGroup}
                  onClick={() => m.href && (window.location.href = m.href)}
                  onMouseEnter={() => setActive(m.id)}
                  onMouseLeave={() => setActive(null)}
                  style={{ cursor: m.href ? 'pointer' : 'default' }}
                >
                  {/* Drop shadow */}
                  <circle
                    cx={m.x + 2} cy={m.y + 3}
                    r={m.type === 'entrance' ? 16 : 14}
                    fill="rgba(0,0,0,0.25)"
                    className={styles.markerShadow}
                  />
                  {/* Main circle */}
                  <circle
                    cx={m.x} cy={m.y}
                    r={m.type === 'entrance' ? 16 : 14}
                    fill={COLOR[m.type]}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="2.5"
                    className={styles.markerCircle}
                  />
                  {/* Number badge for churrasqueros */}
                  {m.num ? (
                    <text
                      x={m.x} y={m.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="Arial, sans-serif"
                      fontSize="10"
                      fontWeight="700"
                      fill="white"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {m.num}
                    </text>
                  ) : (
                    <text
                      x={m.x} y={m.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="12"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {ICON[m.type]}
                    </text>
                  )}

                  {/* Tooltip on hover */}
                  {active === m.id && (
                    <g className={styles.tooltip}>
                      <rect
                        x={m.x - 56} y={m.y - 42}
                        width={112} height={26}
                        rx={6}
                        fill="rgba(20,20,20,0.92)"
                      />
                      <polygon
                        points={`${m.x - 5},${m.y - 17} ${m.x + 5},${m.y - 17} ${m.x},${m.y - 10}`}
                        fill="rgba(20,20,20,0.92)"
                      />
                      <text
                        x={m.x} y={m.y - 26}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="Arial, sans-serif"
                        fontSize="10"
                        fontWeight="500"
                        fill="white"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {m.label}
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {/* ── 7. Static labels for key areas ────────────────────────── */}
              {/* Churrasquero zone label */}
              <rect x="226" y="438" width="210" height="18" rx="4" fill="rgba(0,0,0,0.35)" />
              <text
                x="331" y="450"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Arial, sans-serif"
                fontSize="9"
                fontWeight="600"
                letterSpacing="1.5"
                fill="rgba(255,255,255,0.85)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                ZONA DE CHURRASQUEROS
              </text>

              {/* Property boundary outline */}
              <rect x="4" y="4" width="892" height="552" rx="6"
                fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

              {/* MARFA watermark */}
              <text
                x="880" y="548"
                textAnchor="end"
                fontFamily="Georgia, serif"
                fontSize="10"
                fill="rgba(255,255,255,0.3)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                © MARFA
              </text>
            </svg>

            {/* ── Legend ──────────────────────────────────────────────────── */}
            <div className={styles.legend}>
              {[
                { type: 'bbq',      label: 'Churrasqueros (C1–C7)' },
                { type: 'camping',  label: 'Camping VIP' },
                { type: 'fishing',  label: 'Pesca deportiva' },
                { type: 'wc',       label: 'Servicios' },
                { type: 'entrance', label: 'Entrada' },
              ].map(item => (
                <div key={item.type} className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: COLOR[item.type] }}
                  />
                  <span className={styles.legendLabel}>{item.label}</span>
                </div>
              ))}
              <p className={styles.legendNote}>
                Toca cada marcador para ver el detalle
              </p>
            </div>
          </div>
        </RevealWrapper>

      </div>
    </section>
  );
}
