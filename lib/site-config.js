/**
 * MARFA — Site Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * This file is the single source of truth for all website content.
 * Non-technical administrators can edit text here without touching HTML/CSS.
 *
 * FUTURE: When Directus CMS is connected, this file becomes a fetch() call
 * to the Directus API. The structure matches the Directus collection schema
 * defined in /marfa-cms/directus-schema.json.
 *
 * TO UPDATE CONTENT: Edit the values below. Save the file. Refresh the browser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MARFA_CONFIG = {

  // ── SITE SETTINGS ──────────────────────────────────────────────────────────
  site: {
    name: "MARFA",
    tagline: "Naturaleza · Laguna · Experiencias",
    description: "Un destino natural en Bolivia. Laguna, camping, asadores y eventos privados en 19 hectáreas de naturaleza viva.",
    whatsapp_number: "59170000000",        // ← UPDATE: your actual WhatsApp number
    whatsapp_greeting: "Hola, quisiera información sobre MARFA",
    email: "hola@marfabolivia.com",        // ← UPDATE: your actual email
    phone: "+591 7 000-0000",             // ← UPDATE: your actual phone
    location: "Bolivia",
    instagram_url: "#",                    // ← UPDATE: @marfa or full URL
    facebook_url: "#",                     // ← UPDATE: full Facebook URL
  },

  // ── HERO SECTION ───────────────────────────────────────────────────────────
  hero: {
    eyebrow: "Bolivia · Naturaleza · Experiencias",
    headline_line1: "Un rincón que",
    headline_line2_italic: "no se olvida.",
    subline_tags: ["Laguna natural", "Camping", "Asadores", "Eventos privados"],
    cta_primary_label: "Reservar ahora",
    cta_secondary_label: "Explorar MARFA",
    video_src: "assets/hero.mp4",
    poster_src: "assets/img_hero_poster.jpg",
  },

  // ── BRAND STATEMENT ────────────────────────────────────────────────────────
  statement: {
    text_part1: "19 hectáreas de naturaleza viva.",
    text_part2_italic: "Un espacio para desconectarte,",
    text_part3_italic: "reunirte y vivir algo memorable.",
    sub: "Bolivia · Est. MARFA",
  },

  // ── ABOUT SECTION ──────────────────────────────────────────────────────────
  about: {
    eyebrow: "Sobre MARFA",
    headline: "Un destino natural",
    headline_italic: "diferente.",
    lead: "MARFA es una propiedad natural privada en Bolivia, rodeada de vegetación exuberante y una laguna que se convierte en el corazón de cada visita.",
    body: "Es el tipo de lugar donde el tiempo se detiene: los árboles son grandes, el agua refleja el cielo, y lo que importa es estar presente. Ya sea para pasar el día con familia, acampar bajo las estrellas, celebrar con amigos alrededor de los asadores, o reservar el espacio completo para un evento único, MARFA ofrece algo difícil de encontrar hoy — naturaleza auténtica con espacio para todos.",
    cta_label: "Ver experiencias",
    stats: [
      { number: "19", label: "hectáreas" },
      { number: "1", label: "laguna natural" },
      { number: "∞", label: "momentos" },
    ],
    image_src: "assets/img_lifestyle.jpg",
    image_alt: "Visitantes disfrutando la laguna de MARFA",
    badge_number: "100%",
    badge_label: "Naturaleza",
  },

  // ── LAGOON FEATURE ─────────────────────────────────────────────────────────
  lagoon: {
    eyebrow: "El corazón de MARFA",
    headline: "La laguna que",
    headline_line2: "lo cambia todo.",
    description: "Un espejo de agua natural en medio de 19 hectáreas de verde. Donde el cielo y la tierra se encuentran, y el ruido del mundo desaparece.",
    image_src: "assets/img_lagoon_wide.jpg",
    image_alt: "Laguna natural de MARFA",
  },

  // ── EXPERIENCES ────────────────────────────────────────────────────────────
  experiences: {
    eyebrow: "¿Qué vas a vivir?",
    headline: "Cuatro formas de",
    headline_italic: "disfrutar MARFA.",
    subline: "Desde una tarde espontánea hasta un evento que recordarás para siempre.",
    items: [
      {
        number: "01",
        icon: "🌊",
        title: "La Laguna",
        description: "El protagonista de MARFA. Un espejo de agua natural donde los días se alargan y el horizonte se ensancha. Perfecto para descansar, contemplar y fotografiar.",
        cta_label: "Planifica tu visita",
        image_src: "assets/img_peninsula.jpg",
        image_alt: "Laguna MARFA",
      },
      {
        number: "02",
        icon: "⛺",
        title: "Camping",
        description: "Noche bajo un cielo limpio, rodeado de árboles y silencio. MARFA tiene el espacio para que armes tu campamento y te desconectes de verdad.",
        cta_label: "Reservar camping",
        image_src: "assets/img_land.jpg",
        image_alt: "Camping en MARFA",
      },
      {
        number: "03",
        icon: "🔥",
        title: "Asadores",
        description: "Las mejores reuniones empiezan con buen fuego. Reserva uno de nuestros espacios de parrilla y organiza el asado que todos están esperando.",
        cta_label: "Reservar asador",
        image_src: "assets/img_facilities.jpg",
        image_alt: "Asadores MARFA",
      },
      {
        number: "04",
        icon: "✨",
        title: "Eventos Privados",
        description: "Bodas, cumpleaños, retiros corporativos o una celebración especial. MARFA puede ser tuyo de forma exclusiva para el evento que merece un escenario único.",
        cta_label: "Consultar disponibilidad",
        image_src: "assets/img_aerial.jpg",
        image_alt: "Eventos privados MARFA",
      },
    ],
  },

  // ── WHY MARFA ──────────────────────────────────────────────────────────────
  why: {
    eyebrow: "Por qué MARFA",
    headline: "Lo que hace",
    headline_italic: "especial este lugar.",
    items: [
      {
        icon: "🌿",
        title: "Laguna natural propia",
        description: "Un cuerpo de agua natural dentro de la propiedad. No hay otro lugar igual. La laguna es el alma de MARFA y el centro de cada experiencia.",
      },
      {
        icon: "🌅",
        title: "19 hectáreas de espacio",
        description: "Vastedad real. Espacio para respirar, para jugar, para descansar. No hay hacinamiento. Cada visita se siente como tener el lugar para uno mismo.",
      },
      {
        icon: "🌴",
        title: "Vegetación tropical única",
        description: "Palmeras, árboles frondosos, brisa natural. La naturaleza boliviana en su expresión más verde y más viva, accesible sin necesidad de viajar lejos.",
      },
      {
        icon: "🏕️",
        title: "Camping bajo las estrellas",
        description: "El cielo de MARFA por la noche es tan bueno como el día. Con espacio para carpas y un entorno natural, la noche aquí tiene algo especial.",
      },
      {
        icon: "🍖",
        title: "Asadores reservables",
        description: "Espacios equipados para las reuniones que valen. Fuego, naturaleza y buena compañía — la combinación perfecta para cualquier celebración.",
      },
      {
        icon: "🎉",
        title: "Propiedad privada para eventos",
        description: "Para quienes buscan un escenario fuera de lo ordinario. MARFA completo — toda la tierra, toda la laguna, toda la experiencia — para tu evento.",
      },
    ],
  },

  // ── GALLERY ────────────────────────────────────────────────────────────────
  gallery: {
    eyebrow: "Galería",
    headline: "Un lugar que se siente",
    headline_italic: "mejor de lo que las palabras describen.",
    items: [
      { src: "assets/img_lagoon_wide.jpg",   alt: "Laguna MARFA",            label: "La Laguna" },
      { src: "assets/img_aerial.jpg",        alt: "Vista aérea MARFA",       label: "Vista Aérea" },
      { src: "assets/img_lagoon_palms.jpg",  alt: "Palmas y laguna",         label: "Palmas y Agua" },
      { src: "assets/img_lifestyle.jpg",     alt: "Visitantes en MARFA",     label: "Momentos" },
      { src: "assets/img_peninsula.jpg",     alt: "Península en la laguna",  label: "La Península" },
      { src: "assets/img_lagoon_jungle.jpg", alt: "Laguna y selva",          label: "Selva Viva" },
      { src: "assets/img_paths.jpg",         alt: "Caminos de MARFA",        label: "Los Caminos" },
    ],
  },

  // ── VIDEO SECTION ──────────────────────────────────────────────────────────
  video: {
    eyebrow: "Vista aérea",
    headline: "Mira MARFA desde el aire.",
    description: "Un sobrevuelo que lo dice todo. 19 hectáreas de naturaleza, una laguna que todo lo transforma, y el silencio que solo se encuentra aquí.",
    video_src: "assets/hero.mp4",
    poster_src: "assets/img_aerial.jpg",
  },

  // ── BOOKING ────────────────────────────────────────────────────────────────
  booking: {
    eyebrow: "Reservas",
    headline: "Tu próxima escapada",
    headline_italic: "empieza aquí.",
    subline: "Escríbenos por WhatsApp o completa el formulario. Te respondemos en pocas horas.",
    options: [
      { key: "visita",  icon: "🌅", label: "Visita de día" },
      { key: "camping", icon: "⛺", label: "Camping" },
      { key: "asador",  icon: "🔥", label: "Asador" },
      { key: "evento",  icon: "✨", label: "Evento privado" },
    ],
    whatsapp_cta: "Escribir por WhatsApp",
    form_submit_label: "Enviar solicitud",
  },

  // ── VISION / FUTURE ────────────────────────────────────────────────────────
  vision: {
    eyebrow: "El futuro de MARFA",
    headline: "MARFA está",
    headline_italic: "evolucionando.",
    text: "Creemos que los mejores destinos naturales no se improvisan — se construyen con cuidado. Seguimos trabajando para ofrecer experiencias más curadas, más memorables y más alineadas con la belleza del lugar. Lo que hoy conoces como MARFA es solo el comienzo.",
    badge_label: "Próximamente · Nuevas experiencias",
  },

};

// ── EXPORT ─────────────────────────────────────────────────────────────────
// Named export for Next.js (ES Modules)
export { MARFA_CONFIG };
export default MARFA_CONFIG;
