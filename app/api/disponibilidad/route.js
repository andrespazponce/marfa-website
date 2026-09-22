import { NextResponse } from 'next/server';
import { consultarDisponibilidad } from '@/lib/odoo';

/**
 * POST /api/disponibilidad
 *
 * Proxy server-side hacia Odoo (rental_management) — el navegador nunca ve
 * ODOO_API_KEY. Se llama en cada "Buscar" de la barra: solo cotiza, no crea
 * nada en Odoo (ver TRD.md del módulo, sección "por qué /disponibilidad no
 * usa .new()").
 */
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'JSON inválido.' }, { status: 400 });
  }

  const { status, data } = await consultarDisponibilidad(body);
  return NextResponse.json(data, { status });
}
