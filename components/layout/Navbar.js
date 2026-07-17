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

  const [scrolled,  setScrolled] = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [isDark,    setIsDark]    = useState(true);

  // Initialise theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('marfa-theme');
    const dark = saved !== 'light';
    setIsDark(dark);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    localStorage.setItem('marfa-theme', next ? 'dark' : 'light');
  };

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
    { label: 'Actividades', href: '#experiences'  },
    { label: 'Asadores',    href: '#asadores'     },
    { label: 'Camping',     href: '#camping'      },
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
        {/* Wordmark + theme toggle */}
        <div className={styles.brand}>
          <a href="#" className={styles.wordmark} aria-label={`${name} — inicio`}>
            {name}
          </a>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? (
              /* Sun icon — shown in dark mode to switch to light */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              /* Moon icon — shown in light mode to switch to dark */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

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
