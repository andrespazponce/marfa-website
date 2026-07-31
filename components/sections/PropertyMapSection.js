'use client';
import { useState, useRef, useCallback } from 'react';
import styles from './PropertyMapSection.module.css';

// ── Marker definitions ────────────────────────────────────────────────────────
// Positions are % of image width/height (0–100).
// Edit these after using the interactive placement tool below.
const INITIAL_MARKERS = [
  // { id: 'c1', type: 'bbq', label: 'Churrasquero C1', x: 32, y: 52 },
  // Add more after clicking on the map in edit mode
];

const TYPE_META = {
  bbq:      { label: 'Churrasquero', color: '#C9762A', icon: '🔥', border: '#fff' },
  camping:  { label: 'Camping VIP',  color: '#2E6B3E', icon: '⛺', border: '#fff' },
  wc:       { label: 'Servicios',    color: '#3A5A8A', icon: '🚿', border: '#fff' },
  pool:     { label: 'Piscina',      color: '#1A8AB0', icon: '💧', border: '#fff' },
  entrance: { label: 'Entrada',      color: '#7A4A1A', icon: '🚗', border: '#fff' },
  other:    { label: 'Otro',         color: '#666',    icon: '📍', border: '#fff' },
};

let _nextId = 1;
const nextId = () => `m${_nextId++}`;

export default function PropertyMapSection({ data }) {
  const [markers,    setMarkers]    = useState(INITIAL_MARKERS);
  const [editMode,   setEditMode]   = useState(false);
  const [activeType, setActiveType] = useState('bbq');
  const [selected,   setSelected]   = useState(null);   // marker id
  const [tooltip,    setTooltip]    = useState(null);   // { id, x, y }
  const [labelEdit,  setLabelEdit]  = useState('');
  const containerRef = useRef(null);

  // ── Place a new marker on click ───────────────────────────────────────────
  const handleMapClick = useCallback((e) => {
    if (!editMode) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width  * 100).toFixed(2));
    const y = parseFloat(((e.clientY - rect.top)  / rect.height * 100).toFixed(2));
    const id = nextId();
    const count = markers.filter(m => m.type === activeType).length + 1;
    const meta  = TYPE_META[activeType];
    setMarkers(prev => [
      ...prev,
      { id, type: activeType, label: `${meta.label} ${count}`, x, y },
    ]);
    setSelected(id);
  }, [editMode, activeType, markers]);

  // ── Delete selected marker ────────────────────────────────────────────────
  const deleteSelected = () => {
    setMarkers(prev => prev.filter(m => m.id !== selected));
    setSelected(null);
  };

  // ── Update label of selected ──────────────────────────────────────────────
  const updateLabel = (id, label) =>
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, label } : m));

  const selectedMarker = markers.find(m => m.id === selected);

  return (
    <section className={styles.section} id="property-map">
      <div className={styles.inner}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className={styles.header}>
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 className="section-headline">
            {data.headline} <em>{data.headline_italic}</em>
          </h2>
          <p className={styles.subline}>{data.subline}</p>
        </header>

        {/* ── Edit toolbar ─────────────────────────────────────────────────── */}
        <div className={styles.toolbar}>
          <button
            className={`${styles.editBtn} ${editMode ? styles.editBtnActive : ''}`}
            onClick={() => { setEditMode(v => !v); setSelected(null); }}
          >
            {editMode ? '✓ Guardar posiciones' : '✏️ Editar mapa'}
          </button>

          {editMode && (
            <>
              <span className={styles.toolbarLabel}>Tipo a añadir:</span>
              {Object.entries(TYPE_META).map(([key, m]) => (
                <button
                  key={key}
                  className={`${styles.typeBtn} ${activeType === key ? styles.typeBtnActive : ''}`}
                  style={{ '--dot-color': m.color }}
                  onClick={() => setActiveType(key)}
                >
                  {m.icon} {m.label}
                </button>
              ))}
              <span className={styles.toolbarHint}>Haz clic en el mapa para colocar un marcador</span>
            </>
          )}
        </div>

        {/* ── Map + overlay ────────────────────────────────────────────────── */}
        <div
          ref={containerRef}
          className={`${styles.mapWrap} ${editMode ? styles.mapWrapEdit : ''}`}
          onClick={handleMapClick}
        >
          {/* Illustrated map PNG */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/marfa-map.png"
            alt="Mapa ilustrado de la propiedad MARFA"
            className={styles.mapImg}
            draggable={false}
          />

          {/* SVG marker layer */}
          <svg
            className={styles.markerLayer}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {markers.map(m => {
              const meta = TYPE_META[m.type] ?? TYPE_META.other;
              const isSel = m.id === selected;
              return (
                <g
                  key={m.id}
                  style={{ cursor: editMode ? 'pointer' : 'default' }}
                  onClick={(e) => {
                    if (!editMode) return;
                    e.stopPropagation();
                    setSelected(isSel ? null : m.id);
                    setLabelEdit(m.label);
                  }}
                  onMouseEnter={(e) => {
                    if (editMode) return;
                    const svg = e.currentTarget.closest('svg');
                    const pt  = svg.createSVGPoint();
                    pt.x = e.clientX; pt.y = e.clientY;
                    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                    setTooltip({ id: m.id, x: svgP.x, y: svgP.y, label: m.label });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Shadow */}
                  <circle cx={m.x + 0.3} cy={m.y + 0.5} r={isSel ? 2.8 : 2.3}
                    fill="rgba(0,0,0,0.35)" />
                  {/* Pin circle */}
                  <circle cx={m.x} cy={m.y} r={isSel ? 2.8 : 2.2}
                    fill={meta.color}
                    stroke={isSel ? '#FFD700' : '#fff'}
                    strokeWidth={isSel ? '0.5' : '0.35'} />
                  {/* Icon as text */}
                  <text x={m.x} y={m.y + 0.7}
                    textAnchor="middle" fontSize="2.2"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {meta.icon}
                  </text>
                </g>
              );
            })}

            {/* Tooltip (non-edit mode hover) */}
            {tooltip && !editMode && (() => {
              const tx = tooltip.x > 70 ? tooltip.x - 22 : tooltip.x + 1;
              const ty = tooltip.y > 85 ? tooltip.y - 8  : tooltip.y - 5;
              return (
                <g>
                  <rect x={tx} y={ty} width="22" height="5.5" rx="1.2"
                    fill="rgba(20,20,20,0.88)" />
                  <text x={tx + 11} y={ty + 3.5}
                    textAnchor="middle" fontSize="2.5" fill="#fff"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {tooltip.label}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Edit-mode crosshair hint */}
          {editMode && (
            <div className={styles.crosshairHint}>+</div>
          )}
        </div>

        {/* ── Selected marker editor ───────────────────────────────────────── */}
        {editMode && selectedMarker && (
          <div className={styles.markerEditor}>
            <strong>Marcador seleccionado</strong>
            <label>
              Nombre:
              <input
                value={labelEdit}
                onChange={e => setLabelEdit(e.target.value)}
                onBlur={() => updateLabel(selected, labelEdit)}
                onKeyDown={e => e.key === 'Enter' && updateLabel(selected, labelEdit)}
              />
            </label>
            <span className={styles.coordBadge}>
              x: {selectedMarker.x}% · y: {selectedMarker.y}%
            </span>
            <button className={styles.deleteBtn} onClick={deleteSelected}>
              🗑 Eliminar
            </button>
          </div>
        )}

        {/* ── Export panel (edit mode only) ───────────────────────────────── */}
        {editMode && markers.length > 0 && (
          <details className={styles.exportPanel}>
            <summary>Ver coordenadas para copiar al código</summary>
            <pre className={styles.exportCode}>
              {JSON.stringify(
                markers.map(({ id: _, ...m }) => m),
                null, 2
              )}
            </pre>
          </details>
        )}

        {/* ── Static legend (non-edit mode) ───────────────────────────────── */}
        {!editMode && markers.length > 0 && (
          <div className={styles.legend}>
            {[...new Set(markers.map(m => m.type))].map(type => {
              const meta = TYPE_META[type] ?? TYPE_META.other;
              return (
                <div key={type} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: meta.color }} />
                  <span>{meta.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {!editMode && markers.length === 0 && (
          <p className={styles.mapNote}>
            Los puntos de interés (churrasqueros C1–C7, baños y camping) se añadirán pronto.
            <button
              className={styles.addMarkersBtn}
              onClick={() => setEditMode(true)}
            >
              ✏️ Añadir marcadores ahora
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
