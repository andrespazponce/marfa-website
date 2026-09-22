'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IconSunrise, IconFlame, IconTent, IconSparkles,
  IconUser, IconCalendar, IconSearch,
  IconChevronDown, IconChevronLeft, IconChevronRight,
} from '@/components/ui/Icons';
import styles from './AvailabilitySearchBar.module.css';

/**
 * AvailabilitySearchBar — barra de búsqueda tipo Xcaret, superpuesta al
 * borde inferior del Hero. Cada pestaña es un paquete jerárquico (no una
 * combinación libre): "Asador" ya incluye la entrada del día, "Camping /
 * Hospedaje" ya incluye entrada + asador. "Evento Privado" es aparte
 * (reserva la propiedad completa) y solo pide personas + fecha.
 *
 * Por ahora es solo la interfaz: "Buscar" arma la consulta y la envía por
 * WhatsApp, igual que el resto del sitio hoy — todavía no hay motor de
 * disponibilidad real conectado (ver PRD §5.2).
 */
const PACKAGES = [
  { key: 'dia',     Icon: IconSunrise,  label: 'Por el día' },
  { key: 'asador',  Icon: IconFlame,    label: 'Asador' },
  { key: 'camping', Icon: IconTent,     label: 'Camping / Hospedaje' },
  { key: 'evento',  Icon: IconSparkles, label: 'Evento Privado' },
];

const GUESTS_PANEL_WIDTH  = 280;
const GUESTS_PANEL_HEIGHT = 230;
const DATE_PANEL_WIDTH  = 300;
const DATE_PANEL_HEIGHT = 340; // generoso: un mes de 6 filas es más alto que uno de 5
const WEEKDAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DATE_BTN_FORMATTER = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });

function monthLabel(viewDate) {
  return `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
}

// 'YYYY-MM-DD' a partir de las partes locales — toISOString() usa UTC y
// puede correr la fecha un día si la zona horaria va detrás de UTC.
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a, b) {
  return !!a && !!b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// Grilla del mes: null para los huecos antes del día 1 (semana empieza lunes).
function buildMonthGrid(viewDate) {
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Lun=0…Dom=6
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  const cells = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Se abre debajo del botón salvo que no entre en la pantalla — ahí se abre
// hacia arriba en su lugar (sin esto, un campo cerca del borde inferior del
// viewport, algo común en mobile, dejaba casi todo el panel fuera de vista).
function anchoredPosition(btnEl, panelWidth, panelHeight) {
  const rect = btnEl.getBoundingClientRect();
  const left = Math.min(rect.left, window.innerWidth - panelWidth - 16);
  const spaceBelow = window.innerHeight - rect.bottom;
  const openAbove = spaceBelow < panelHeight + 16 && rect.top > panelHeight + 16;
  const top = openAbove ? rect.top - panelHeight - 8 : rect.bottom + 8;
  return { top: Math.max(8, top), left: Math.max(16, left) };
}

export default function AvailabilitySearchBar({ site }) {
  const [activePackage, setActivePackage] = useState('dia');
  const [adults, setAdults]     = useState(1);
  const [children, setChildren] = useState(0);

  const [selectedDate, setSelectedDate] = useState(null); // Date | null
  const [viewDate, setViewDate]         = useState(() => new Date());
  const [dateOpen, setDateOpen]         = useState(false);
  const [datePanelPos, setDatePanelPos] = useState({ top: 0, left: 0 });
  const dateRef      = useRef(null);
  const dateBtnRef   = useRef(null);
  const datePanelRef = useRef(null);

  const [guestsOpen, setGuestsOpen] = useState(false);
  const [guestsPanelPos, setGuestsPanelPos] = useState({ top: 0, left: 0 });
  const guestsRef      = useRef(null);
  const guestsBtnRef   = useRef(null);
  const guestsPanelRef = useRef(null);

  // Cerrar al hacer click afuera — cada popover chequea su propio trigger +
  // su propio panel (el panel vive en un portal, ver nota más abajo).
  useEffect(() => {
    const onClickOutside = (e) => {
      const insideGuests = (guestsRef.current && guestsRef.current.contains(e.target))
        || (guestsPanelRef.current && guestsPanelRef.current.contains(e.target));
      if (!insideGuests) setGuestsOpen(false);

      const insideDate = (dateRef.current && dateRef.current.contains(e.target))
        || (datePanelRef.current && datePanelRef.current.contains(e.target));
      if (!insideDate) setDateOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Ambos paneles se renderizan en un portal a document.body y usan
  // position:fixed calculado a mano. Motivo: cualquier ancestro con una
  // animación que toque `transform` (como el fadeUp de la franja, o los
  // RevealWrapper de scroll-reveal que usa el resto del sitio) crea sin
  // querer un containing block nuevo para position:fixed, y el Hero además
  // tiene overflow:hidden — juntos dejaban el panel recortado/atrapado
  // dentro del Hero en vez de flotar sobre toda la página. El portal lo
  // saca de esa jerarquía por completo.
  useEffect(() => {
    if (!guestsOpen && !dateOpen) return;
    const closeBoth = () => {
      setGuestsOpen(false);
      setDateOpen(false);
    };
    window.addEventListener('scroll', closeBoth, { passive: true });
    window.addEventListener('resize', closeBoth);
    return () => {
      window.removeEventListener('scroll', closeBoth);
      window.removeEventListener('resize', closeBoth);
    };
  }, [guestsOpen, dateOpen]);

  const toggleGuests = () => {
    if (!guestsOpen && guestsBtnRef.current) {
      setGuestsPanelPos(anchoredPosition(guestsBtnRef.current, GUESTS_PANEL_WIDTH, GUESTS_PANEL_HEIGHT));
    }
    setDateOpen(false);
    setGuestsOpen((v) => !v);
  };

  const toggleDate = () => {
    if (!dateOpen && dateBtnRef.current) {
      setDatePanelPos(anchoredPosition(dateBtnRef.current, DATE_PANEL_WIDTH, DATE_PANEL_HEIGHT));
      setViewDate(selectedDate || new Date());
    }
    setGuestsOpen(false);
    setDateOpen((v) => !v);
  };

  const pickDay = (day) => {
    setSelectedDate(day);
    setDateOpen(false);
  };

  const shiftMonth = (delta) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSearch = () => {
    const pkg = PACKAGES.find((p) => p.key === activePackage);
    const message = [
      'Hola, quisiera consultar disponibilidad en MARFA.',
      `Paquete: ${pkg.label}`,
      `Adultos: ${adults}`,
      children > 0 ? `Niños: ${children}` : '',
      selectedDate ? `Fecha: ${toISODate(selectedDate)}` : '',
    ].filter(Boolean).join('\n');

    window.open(
      `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const guestsSummary =
    `${adults} ${adults === 1 ? 'Adulto' : 'Adultos'} · ${children} ${children === 1 ? 'Niño' : 'Niños'}`;

  const dateSummary = selectedDate ? DATE_BTN_FORMATTER.format(selectedDate) : 'Fecha de visita';

  const monthGrid = buildMonthGrid(viewDate);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.tabs} role="tablist" aria-label="Tipo de paquete">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.key}
              type="button"
              role="tab"
              aria-selected={activePackage === pkg.key}
              className={`${styles.tab} ${activePackage === pkg.key ? styles.tabActive : ''}`}
              onClick={() => setActivePackage(pkg.key)}
            >
              <pkg.Icon className={styles.tabIcon} />
              <span>{pkg.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.fields}>
          {/* Adultos / Niños */}
          <div className={styles.guestsField} ref={guestsRef}>
            <button
              type="button"
              ref={guestsBtnRef}
              className={styles.fieldBtn}
              onClick={toggleGuests}
              aria-expanded={guestsOpen}
              aria-haspopup="true"
            >
              <IconUser className={styles.fieldIcon} />
              <span className={styles.fieldText}>{guestsSummary}</span>
              <IconChevronDown className={styles.chevron} />
            </button>

            {guestsOpen && createPortal(
              <div
                ref={guestsPanelRef}
                className={styles.guestsPanel}
                role="group"
                aria-label="Cantidad de personas"
                style={{ top: guestsPanelPos.top, left: guestsPanelPos.left }}
              >
                <div className={styles.stepperRow}>
                  <div className={styles.stepperLabel}>
                    <span>Adultos</span>
                    <small>13 años o más</small>
                  </div>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      onClick={() => setAdults((a) => clamp(a - 1, 1, 30))}
                      aria-label="Restar adulto"
                    >−</button>
                    <span>{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((a) => clamp(a + 1, 1, 30))}
                      aria-label="Sumar adulto"
                    >+</button>
                  </div>
                </div>

                <div className={styles.stepperRow}>
                  <div className={styles.stepperLabel}>
                    <span>Niños</span>
                    <small>0 a 12 años</small>
                  </div>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      onClick={() => setChildren((c) => clamp(c - 1, 0, 30))}
                      aria-label="Restar niño"
                    >−</button>
                    <span>{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((c) => clamp(c + 1, 0, 30))}
                      aria-label="Sumar niño"
                    >+</button>
                  </div>
                </div>

                <button type="button" className={styles.guestsDone} onClick={() => setGuestsOpen(false)}>
                  Listo
                </button>
              </div>,
              document.body
            )}
          </div>

          {/* Fecha */}
          <div className={styles.dateField} ref={dateRef}>
            <button
              type="button"
              ref={dateBtnRef}
              className={styles.fieldBtn}
              onClick={toggleDate}
              aria-expanded={dateOpen}
              aria-haspopup="true"
            >
              <IconCalendar className={styles.fieldIcon} />
              <span className={styles.fieldText}>{dateSummary}</span>
              <IconChevronDown className={styles.chevron} />
            </button>

            {dateOpen && createPortal(
              <div
                ref={datePanelRef}
                className={styles.datePanel}
                role="group"
                aria-label="Fecha de visita"
                style={{ top: datePanelPos.top, left: datePanelPos.left }}
              >
                <div className={styles.calHeader}>
                  <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
                    <IconChevronLeft />
                  </button>
                  <span className={styles.calMonthLabel}>{monthLabel(viewDate)}</span>
                  <button type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
                    <IconChevronRight />
                  </button>
                </div>

                <div className={styles.calWeekdays}>
                  {WEEKDAY_LABELS.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>

                <div className={styles.calGrid}>
                  {monthGrid.map((day, i) => {
                    if (!day) return <span key={i} className={styles.calDayEmpty} />;
                    const isPast = day < today;
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, today);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isPast}
                        onClick={() => pickDay(day)}
                        className={[
                          styles.calDay,
                          isSelected ? styles.calDaySelected : '',
                          isToday && !isSelected ? styles.calDayToday : '',
                        ].join(' ')}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Buscar */}
          <button type="button" className={styles.searchBtn} onClick={handleSearch}>
            <IconSearch className={styles.searchIcon} /> Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
