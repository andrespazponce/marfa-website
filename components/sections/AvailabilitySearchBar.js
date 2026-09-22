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
 * Día/Asador/Camping-Hospedaje llaman a la API de reservas de Odoo
 * (rental_management, vía /api/disponibilidad y /api/reservas — ver
 * lib/odoo.js). "Buscar" solo cotiza (no crea nada en Odoo); "Confirmar
 * reserva" recién ahí crea la cotización real. Evento Privado todavía no
 * está modelado en Odoo (bloquea todo el predio) — sigue yendo directo a
 * WhatsApp, como el resto del sitio.
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
const DATE_PANEL_HEIGHT = 364; // generoso: un mes de 6 filas + el hint de rango es más alto que uno de 5
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

// Quita el prefijo "[CODIGO_INTERNO]" que arma Odoo delante del nombre del
// producto — es un detalle interno (default_code), no algo para el cliente.
function displayProductName(name) {
  return name.replace(/^\[.*?\]\s*/, '');
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

  const [selectedDate, setSelectedDate]       = useState(null); // Date | null — check-in (o fecha única)
  const [selectedEndDate, setSelectedEndDate] = useState(null); // Date | null — check-out, solo camping
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

  // Resultado de la última cotización — se invalida apenas cambia algo de
  // lo que se buscó, para no dejar un total viejo confirmable.
  const [searching, setSearching]           = useState(false);
  const [quote, setQuote]                   = useState(null);
  const [quoteError, setQuoteError]         = useState(null);
  const [confirming, setConfirming]         = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    setConfirmedOrder(null);
  }, [activePackage, adults, children, selectedDate, selectedEndDate]);

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

  const isCamping = activePackage === 'camping';

  const pickDay = (day) => {
    if (!isCamping) {
      setSelectedDate(day);
      setDateOpen(false);
      return;
    }
    // Rango check-in/check-out: primer click marca la llegada; el segundo,
    // si es posterior, marca la salida y cierra. Un click antes/igual a la
    // llegada actual reinicia el rango en vez de dar una estadía de 0 noches.
    if (!selectedDate || selectedEndDate || day <= selectedDate) {
      setSelectedDate(day);
      setSelectedEndDate(null);
    } else {
      setSelectedEndDate(day);
      setDateOpen(false);
    }
  };

  const shiftMonth = (delta) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canSearch = isCamping ? !!(selectedDate && selectedEndDate) : !!selectedDate;

  const buildPayload = () => ({
    paquete: activePackage,
    fecha_inicio: toISODate(selectedDate),
    ...(isCamping ? { fecha_fin: toISODate(selectedEndDate) } : {}),
    adultos: adults,
    ninos: children,
  });

  const openWhatsapp = (message) => {
    window.open(
      `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const handleSearch = async () => {
    if (activePackage === 'evento') {
      // Evento Privado reserva la propiedad completa — todavía no modelado
      // en Odoo (ver PRD de rental_management, Roadmap). Sigue yendo directo
      // a WhatsApp, como el resto del sitio hoy.
      openWhatsapp([
        'Hola, quisiera consultar disponibilidad en MARFA.',
        'Paquete: Evento Privado',
        `Adultos: ${adults}`,
        children > 0 ? `Niños: ${children}` : '',
        selectedDate ? `Fecha: ${toISODate(selectedDate)}` : '',
      ].filter(Boolean).join('\n'));
      return;
    }

    if (!canSearch) {
      setQuoteError(
        isCamping
          ? 'Elegí la fecha de ingreso y de salida antes de buscar.'
          : 'Elegí la fecha de visita antes de buscar.'
      );
      return;
    }

    setSearching(true);
    setQuoteError(null);
    setQuote(null);
    setConfirmedOrder(null);

    try {
      const res = await fetch('/api/disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setQuoteError(data.error || 'No se pudo consultar disponibilidad.');
      } else {
        setQuote(data);
      }
    } catch {
      setQuoteError('No se pudo conectar con el sistema de reservas.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setQuoteError(null);
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), orden_id: confirmedOrder?.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setQuoteError(data.error || 'No se pudo confirmar la reserva.');
      } else {
        setConfirmedOrder({ id: data.orden_id, name: data.orden_nombre });
      }
    } catch {
      setQuoteError('No se pudo conectar con el sistema de reservas.');
    } finally {
      setConfirming(false);
    }
  };

  const handleContinueWhatsapp = () => {
    const pkg = PACKAGES.find((p) => p.key === activePackage);
    openWhatsapp([
      'Hola, quisiera confirmar mi reserva en MARFA.',
      confirmedOrder?.name ? `N° de cotización: ${confirmedOrder.name}` : '',
      `Paquete: ${pkg.label}`,
      `Adultos: ${adults}`,
      children > 0 ? `Niños: ${children}` : '',
      `Fecha: ${toISODate(selectedDate)}${isCamping ? ` al ${toISODate(selectedEndDate)}` : ''}`,
      quote?.total != null ? `Total: ${quote.moneda} ${quote.total.toFixed(2)}` : '',
    ].filter(Boolean).join('\n'));
  };

  const handleConsultWhatsapp = () => {
    openWhatsapp('Hola, quisiera consultar otras fechas para MARFA.');
  };

  const guestsSummary =
    `${adults} ${adults === 1 ? 'Adulto' : 'Adultos'} · ${children} ${children === 1 ? 'Niño' : 'Niños'}`;

  const dateSummary = isCamping
    ? (selectedDate && selectedEndDate)
      ? `${DATE_BTN_FORMATTER.format(selectedDate)} - ${DATE_BTN_FORMATTER.format(selectedEndDate)}`
      : selectedDate
        ? `${DATE_BTN_FORMATTER.format(selectedDate)} → salida`
        : 'Fechas de estadía'
    : selectedDate ? DATE_BTN_FORMATTER.format(selectedDate) : 'Fecha de visita';

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
              onClick={() => {
                setActivePackage(pkg.key);
                setSelectedDate(null);
                setSelectedEndDate(null);
              }}
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
                aria-label={isCamping ? 'Fechas de ingreso y salida' : 'Fecha de visita'}
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

                {isCamping && (
                  <p className={styles.calHint}>
                    {selectedDate && !selectedEndDate
                      ? 'Elegí la fecha de salida'
                      : 'Elegí ingreso y salida'}
                  </p>
                )}

                <div className={styles.calWeekdays}>
                  {WEEKDAY_LABELS.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>

                <div className={styles.calGrid}>
                  {monthGrid.map((day, i) => {
                    if (!day) return <span key={i} className={styles.calDayEmpty} />;
                    const isPast = day < today;
                    const isRangeEnd = isCamping && isSameDay(day, selectedEndDate);
                    const isSelected = isSameDay(day, selectedDate) || isRangeEnd;
                    const isToday = isSameDay(day, today);
                    const isInRange = isCamping && selectedDate && selectedEndDate
                      && day > selectedDate && day < selectedEndDate;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isPast}
                        onClick={() => pickDay(day)}
                        className={[
                          styles.calDay,
                          isSelected ? styles.calDaySelected : '',
                          isInRange ? styles.calDayInRange : '',
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
          <button type="button" className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
            <IconSearch className={styles.searchIcon} /> {searching ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {quoteError && (
          <div className={styles.quoteError} role="alert">{quoteError}</div>
        )}

        {quote && (
          <div className={styles.quoteResult}>
            <div className={styles.quoteLines}>
              {quote.lineas.map((linea, i) => (
                <div key={i} className={styles.quoteLine}>
                  <span>{linea.cantidad}× {displayProductName(linea.producto)}</span>
                  <span>{quote.moneda} {linea.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className={styles.quoteTotal}>
              <span>Total</span>
              <span>{quote.moneda} {quote.total.toFixed(2)}</span>
            </div>

            {quote.disponible ? (
              confirmedOrder ? (
                <div className={styles.quoteConfirmed}>
                  <p>Reserva registrada: <strong>{confirmedOrder.name}</strong></p>
                  <button type="button" className={styles.waContinueBtn} onClick={handleContinueWhatsapp}>
                    Continuar por WhatsApp
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? 'Confirmando…' : 'Confirmar reserva'}
                </button>
              )
            ) : (
              <div className={styles.quoteUnavailable}>
                <p>No disponible para esas fechas:</p>
                <ul>
                  {quote.mensajes.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
                <button type="button" className={styles.waContinueBtn} onClick={handleConsultWhatsapp}>
                  Consultar por WhatsApp
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
