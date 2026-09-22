/**
 * MARFA — Cliente de la API de reservas de Odoo
 * ─────────────────────────────────────────────────────────────────────────────
 * Único punto de integración con el módulo `rental_management` de Odoo
 * (D:\dev\odoo-desarrollo, base `marfa_v1`). Ver su TRD.md §4 para el
 * contrato completo de /disponibilidad y /reservas.
 *
 * SIEMPRE se llama server-side (desde las rutas en app/api/*) — nunca desde
 * el navegador. La API key de Odoo (ODOO_API_KEY) es un secreto de servidor;
 * si este módulo se importara desde un componente cliente, quedaría expuesta
 * en el bundle de JS que baja al navegador.
 *
 * host.docker.internal (no localhost) en ODOO_URL: este sitio y Odoo corren
 * en contenedores Docker separados — localhost dentro del contenedor de
 * Next.js apunta al contenedor mismo, no al host ni a otros contenedores.
 * ─────────────────────────────────────────────────────────────────────────────
 */

async function callOdoo(endpoint, payload) {
  const url = `${process.env.ODOO_URL}/api/marfa/${endpoint}`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Odoo-Database': process.env.ODOO_DB,
        'X-Api-Key': process.env.ODOO_API_KEY,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (err) {
    console.error(`[Odoo] No se pudo conectar a ${url}:`, err.message);
    return {
      status: 503,
      data: { ok: false, error: 'No se pudo conectar con el sistema de reservas.' },
    };
  }

  const data = await res.json();
  return { status: res.status, data };
}

/**
 * Cotiza un paquete SIN crear nada en Odoo (ver rental_management: usa un
 * savepoint que siempre revierte). Seguro de llamar en cada "Buscar".
 */
export function consultarDisponibilidad(payload) {
  return callOdoo('disponibilidad', payload);
}

/**
 * Crea (o reutiliza, vía payload.orden_id) la cotización REAL en borrador.
 * Llamar solo al confirmar, no en cada búsqueda.
 */
export function crearReserva(payload) {
  return callOdoo('reservas', payload);
}
