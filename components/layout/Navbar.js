'use client';

import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

/**
 * Navbar — fixed top navigation with:
 * - Transparent on hero, dark on scroll
 * - Hamburger menu for mobile with clip-path reveal animation
 * - WhatsApp CTA in nav
 */
export default function Navbar({ config }) {
  const { name, whatsapp_number, whatsapp_greeting } = config.site;
  const waHref = `https://wa.me/${whatsapp_number}?text=${encodeURIComponent(whatsapp_greeting)}`;

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { label: 'La Laguna',   href: '#lagoon'       },
    { label: 'Experiencias',href: '#experiences'  },
    { label: 'Galería',     href: '#gallery'      },
    { label: 'Reservas',    href: '#booking'      },
  ];

  return (
    <nav
      className={[
        styles.nav,
        scrolled  ? styles.scrolled  : '',
        menuOpen  ? styles.menuOpen  : '',
      ].join(' ')}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className={styles.inner}>
        {/* Wordmark */}
        <a href="#" className={styles.wordmark} aria-label={`${name} — inicio`}>
          {name}
        </a>

        {/* Desktop links */}
        <ul className={styles.links} role="list">
          {navLinks.map(link => (
            <li key={link.href}>
              <a href={link.href} className={styles.link}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaDesktop}
        >
          Reservar
        </a>

        {/* Hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(v => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={styles.hLine} />
          <span className={styles.hLine} />
          <span className={styles.hLine} />
        </button>
      </div>

      {/* Mobile overlay menu */}
      <div className={styles.mobileMenu} aria-hidden={!menuOpen}>
        <ul className={styles.mobileLinks} role="list">
          {navLinks.map((link, i) => (
            <li
              key={link.href}
              className={styles.mobileLinkItem}
              style={{ transitionDelay: menuOpen ? `${0.05 + i * 0.06}s` : '0s' }}
            >
              <a
                href={link.href}
                className={styles.mobileLink}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mobileCta}
          onClick={() => setMenuOpen(false)}
        >
          Reservar por WhatsApp
        </a>
      </div>
    </nav>
  );
}
