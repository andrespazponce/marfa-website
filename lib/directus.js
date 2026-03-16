/**
 * MARFA — Directus API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * This module is the single integration point with Directus CMS.
 *
 * USAGE MODES:
 *   1. USE_LOCAL_CONFIG=true  → returns data from /lib/site-config.js (no Directus needed)
 *   2. USE_LOCAL_CONFIG=false → fetches live data from Directus REST API
 *
 * When Directus is connected, every fetch is cached with ISR (revalidateSeconds).
 * A Directus Flow webhook triggers /api/revalidate to bust the cache on content save.
 *
 * ARCHITECTURE NOTE:
 * All data-fetching functions live here. Page components call these functions
 * and receive a unified SiteConfig object — they don't know or care whether
 * the data came from Directus or from the local config file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { MARFA_CONFIG } from './site-config.js';

const DIRECTUS_URL  = process.env.DIRECTUS_URL  || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || '';
const USE_LOCAL      = process.env.USE_LOCAL_CONFIG === 'true' || !DIRECTUS_TOKEN;

// ISR revalidation — content refreshes every 60 seconds even without a webhook
const REVALIDATE_SECONDS = 60;

// ── Internal fetch helper ──────────────────────────────────────────────────

async function directusFetch(path, options = {}) {
  const url = `${DIRECTUS_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    next: { revalidate: REVALIDATE_SECONDS },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Directus fetch failed: ${res.status} ${res.statusText} — ${url}`);
  }

  const json = await res.json();
  return json.data;
}

// ── Asset URL helper ───────────────────────────────────────────────────────

/**
 * Convert a Directus file ID to a public asset URL.
 * @param {string} fileId  — Directus file UUID
 * @param {object} params  — Optional transform params (width, height, fit, quality)
 * @returns {string}
 */
export function assetUrl(fileId, params = {}) {
  if (!fileId) return '';

  // If fileId is already a full path (local mode), return as-is
  if (fileId.startsWith('/') || fileId.startsWith('assets/') || fileId.startsWith('http')) {
    return fileId;
  }

  const query = new URLSearchParams(params).toString();
  return `${DIRECTUS_URL}/assets/${fileId}${query ? `?${query}` : ''}`;
}

// ── Directus collection fetchers ───────────────────────────────────────────

async function fetchSiteSettings() {
  const data = await directusFetch('/items/site_settings/1?fields=*');
  return {
    name:               data.name,
    tagline:            data.tagline,
    description:        data.description,
    whatsapp_number:    data.whatsapp_number,
    whatsapp_greeting:  data.whatsapp_greeting,
    email:              data.email,
    phone:              data.phone,
    location:           data.location,
    instagram_url:      data.instagram_url,
    facebook_url:       data.facebook_url,
  };
}

async function fetchHeroSection() {
  const data = await directusFetch('/items/hero_section/1?fields=*,video_file.id,poster_image.id');
  return {
    eyebrow:              data.eyebrow,
    headline_line1:       data.headline_line1,
    headline_line2_italic:data.headline_line2_italic,
    subline_tags:         data.subline_tags || [],
    cta_primary_label:    data.cta_primary_label,
    cta_secondary_label:  data.cta_secondary_label,
    video_src:            assetUrl(data.video_file?.id),
    poster_src:           assetUrl(data.poster_image?.id, { width: 1920, quality: 80 }),
  };
}

async function fetchAboutSection() {
  const data = await directusFetch('/items/about_section/1?fields=*,main_image.id');
  return {
    eyebrow:          data.eyebrow,
    headline:         data.headline,
    headline_italic:  data.headline_italic,
    lead:             data.lead,
    body:             data.body,
    cta_label:        data.cta_label,
    stats:            data.stats || [],
    image_src:        assetUrl(data.main_image?.id, { width: 900, quality: 85 }),
    image_alt:        data.main_image_alt,
    badge_number:     data.badge_number,
    badge_label:      data.badge_label,
  };
}

async function fetchExperiences() {
  const items = await directusFetch(
    '/items/experiences?fields=*,image.id&sort=sort_order&filter[status][_eq]=published'
  );
  return items.map(item => ({
    number:       item.sort_order?.toString().padStart(2, '0'),
    icon:         item.icon,
    title:        item.title,
    description:  item.description,
    cta_label:    item.cta_label,
    image_src:    assetUrl(item.image?.id, { width: 800, quality: 85 }),
    image_alt:    item.image_alt,
  }));
}

async function fetchWhyMarfa() {
  const [section, items] = await Promise.all([
    directusFetch('/items/why_section/1?fields=*'),
    directusFetch('/items/why_items?fields=*&sort=sort_order&filter[status][_eq]=published'),
  ]);
  return {
    eyebrow:         section.eyebrow,
    headline:        section.headline,
    headline_italic: section.headline_italic,
    items: items.map(item => ({
      icon:        item.icon,
      title:       item.title,
      description: item.description,
    })),
  };
}

async function fetchGallery() {
  const [section, items] = await Promise.all([
    directusFetch('/items/gallery_section/1?fields=*'),
    directusFetch('/items/gallery_items?fields=*,image.id&sort=sort_order&filter[status][_eq]=published'),
  ]);
  return {
    eyebrow:         section.eyebrow,
    headline:        section.headline,
    headline_italic: section.headline_italic,
    items: items.map(item => ({
      src:   assetUrl(item.image?.id, { width: 1200, quality: 85 }),
      alt:   item.alt_text,
      label: item.label,
    })),
  };
}

async function fetchVideoSection() {
  const data = await directusFetch('/items/video_section/1?fields=*,video_file.id,poster_image.id');
  return {
    eyebrow:     data.eyebrow,
    headline:    data.headline,
    description: data.description,
    video_src:   assetUrl(data.video_file?.id),
    poster_src:  assetUrl(data.poster_image?.id, { width: 1920, quality: 80 }),
  };
}

async function fetchBookingSection() {
  const data = await directusFetch('/items/booking_section/1?fields=*');
  return {
    eyebrow:           data.eyebrow,
    headline:          data.headline,
    headline_italic:   data.headline_italic,
    subline:           data.subline,
    options:           data.booking_options || [],
    whatsapp_cta:      data.whatsapp_cta,
    form_submit_label: data.form_submit_label,
  };
}

async function fetchVisionSection() {
  const data = await directusFetch('/items/vision_section/1?fields=*');
  return {
    eyebrow:         data.eyebrow,
    headline:        data.headline,
    headline_italic: data.headline_italic,
    text:            data.text,
    badge_label:     data.badge_label,
  };
}

// ── Main exported function ────────────────────────────────────────────────

/**
 * getSiteConfig()
 *
 * Returns the full site configuration object. Automatically switches between
 * local config (USE_LOCAL_CONFIG=true) and live Directus API.
 *
 * Used in: app/page.js (server component) and any page that needs full config.
 *
 * @returns {Promise<SiteConfig>}
 */
export async function getSiteConfig() {
  // LOCAL MODE: return the static config directly
  if (USE_LOCAL) {
    console.log('[MARFA] Using local site-config.js (Directus not connected)');
    return MARFA_CONFIG;
  }

  // DIRECTUS MODE: fetch all collections in parallel
  try {
    console.log('[MARFA] Fetching content from Directus:', DIRECTUS_URL);

    const [
      site,
      hero,
      statement,
      about,
      lagoon,
      experiencesItems,
      why,
      gallery,
      video,
      booking,
      vision,
    ] = await Promise.all([
      fetchSiteSettings(),
      fetchHeroSection(),
      directusFetch('/items/statement_section/1?fields=*'),
      fetchAboutSection(),
      directusFetch('/items/lagoon_section/1?fields=*,main_image.id'),
      fetchExperiences(),
      fetchWhyMarfa(),
      fetchGallery(),
      fetchVideoSection(),
      fetchBookingSection(),
      fetchVisionSection(),
    ]);

    return {
      site,
      hero,
      statement: {
        text_part1:        statement.text_part1,
        text_part2_italic: statement.text_part2_italic,
        text_part3_italic: statement.text_part3_italic,
        sub:               statement.sub,
      },
      about,
      lagoon: {
        eyebrow:      lagoon.eyebrow,
        headline:     lagoon.headline,
        headline_line2: lagoon.headline_line2,
        description:  lagoon.description,
        image_src:    assetUrl(lagoon.main_image?.id, { width: 1400, quality: 90 }),
        image_alt:    lagoon.main_image_alt,
      },
      experiences: {
        eyebrow:         lagoon.eyebrow,   // reuse or fetch separately
        headline:        '',
        headline_italic: '',
        subline:         '',
        items:           experiencesItems,
      },
      why,
      gallery,
      video,
      booking,
      vision,
    };
  } catch (err) {
    console.error('[MARFA] Directus fetch failed, falling back to local config:', err.message);
    // Graceful degradation — show site with local content if CMS is unreachable
    return MARFA_CONFIG;
  }
}
