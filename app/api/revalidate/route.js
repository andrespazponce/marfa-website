import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 *
 * Called by a Directus Flow webhook whenever content is saved.
 * Triggers ISR revalidation so the site reflects CMS changes immediately.
 *
 * ── Setup in Directus ────────────────────────────────────────────────────────
 * 1. Go to Settings → Flows → Create Flow
 * 2. Trigger: Action (After Save) on collections: site_settings, hero_section,
 *    about_section, experiences, why_items, gallery_items, etc.
 * 3. Add operation: Webhook / Request URL
 *    Method: POST
 *    URL: https://your-site.com/api/revalidate
 *    Headers: { "x-revalidate-secret": "your-REVALIDATE_SECRET-value" }
 *    Body: { "path": "/" }
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function POST(request) {
  const secret = request.headers.get('x-revalidate-secret');

  // Validate secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: 'Invalid revalidation secret' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const path = body.path || '/';

    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      now: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { message: 'Revalidation failed', error: err.message },
      { status: 500 }
    );
  }
}
