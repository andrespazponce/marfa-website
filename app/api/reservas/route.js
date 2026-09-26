import { NextResponse } from 'next/server';
import { crearReserva } from '@/lib/odoo';

/**
 * POST /api/reservas
 *
 * Proxy server-side hacia Odoo (rental_management) — el navegador nunca ve
 * ODOO_API_KEY. Se llama solo cuando el visitante confirma en el formulario:
 * a diferencia de /api/disponibilidad, esto SÍ crea una cotización real en
 * borrador en Odoo (sale.order, state='draft').
 */
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'JSON inválido.' }, { status: 400 });
  }

  const { status, data } = await crearReserva(body);
  return NextResponse.json(data, { status });
}
