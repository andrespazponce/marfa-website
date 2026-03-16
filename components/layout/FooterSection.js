import styles from './FooterSection.module.css';

export default function FooterSection({ site }) {
  const waHref = `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(site.whatsapp_greeting)}`;
  const year   = new Date().getFullYear();

  const navLinks = [
    { label: 'La Laguna',    href: '#lagoon'      },
    { label: 'Experiencias', href: '#experiences' },
    { label: 'Galería',      href: '#gallery'     },
    { label: 'Reservas',     href: '#booking'     },
    { label: 'Nosotros',     href: '#about'       },
  ];

  return (
    <footer className={styles.footer} aria-label="Pie de página">
      <div className={styles.inner}>

        {/* Top row */}
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <a href="#" className={styles.wordmark} aria-label={`${site.name} — inicio`}>
              {site.name}
            </a>
            <p className={styles.tagline}>{site.tagline}</p>
          </div>

          {/* Nav */}
          <nav className={styles.nav} aria-label="Navegación de pie">
            <ul className={styles.navList} role="list">
              {navLinks.map(link => (
                <li key={link.href}>
                  <a href={link.href} className={styles.navLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className={styles.contact}>
            <p className={styles.contactTitle}>Contáctanos</p>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
              WhatsApp
            </a>
            <a href={`mailto:${site.email}`} className={styles.contactLink}>
              {site.email}
            </a>
            <a href={`tel:${site.phone}`} className={styles.contactLink}>
              {site.phone}
            </a>
          </div>

          {/* Social */}
          <div className={styles.social}>
            <p className={styles.contactTitle}>Síguenos</p>
            <div className={styles.socialLinks}>
              {site.instagram_url && site.instagram_url !== '#' && (
                <a
                  href={site.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              )}
              {site.facebook_url && site.facebook_url !== '#' && (
                <a
                  href={site.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="Facebook"
                >
                  <FacebookIcon />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {year} {site.name}. {site.location}. Todos los derechos reservados.
          </p>
          <p className={styles.copy}>
            <em>Naturaleza · Laguna · Experiencias</em>
          </p>
        </div>

      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
