'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './GalleryGrid.module.css';

/**
 * GalleryGrid — mosaic photo grid with keyboard-navigable lightbox.
 */
export default function GalleryGrid({ items }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const isOpen = lightboxIndex !== null;

  const open  = useCallback((i) => setLightboxIndex(i), []);
  const close = useCallback(() => setLightboxIndex(null), []);
  const prev  = useCallback(() => setLightboxIndex(i => (i - 1 + items.length) % items.length), [items.length]);
  const next  = useCallback(() => setLightboxIndex(i => (i + 1) % items.length), [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   prev();
      if (e.key === 'ArrowRight')  next();
    };

    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close, prev, next]);

  // CSS grid position classes for mosaic layout
  const mosaicClass = (i) => styles[`gm${i + 1}`] || '';

  const activeItem = isOpen ? items[lightboxIndex] : null;

  return (
    <>
      {/* Mosaic grid */}
      <div className={styles.mosaic} role="list">
        {items.map((item, i) => (
          <div
            key={i}
            className={`${styles.cell} ${mosaicClass(i)}`}
            role="listitem"
          >
            <button
              className={styles.cellBtn}
              onClick={() => open(i)}
              aria-label={`Ver imagen: ${item.alt}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.cellImg}
                loading="lazy"
              />
              <div className={styles.cellOverlay} aria-hidden="true">
                <span className={styles.cellLabel}>{item.label}</span>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {isOpen && activeItem && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Galería de imágenes"
          onClick={close}
        >
          {/* Counter */}
          <div className={styles.lbCounter} onClick={e => e.stopPropagation()}>
            {lightboxIndex + 1} / {items.length}
          </div>

          {/* Image wrapper */}
          <div
            className={styles.lbImgWrap}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={activeItem.src}
              alt={activeItem.alt}
              fill
              sizes="90vw"
              className={styles.lbImg}
              priority
            />
            <span className={styles.lbLabel}>{activeItem.label}</span>
          </div>

          {/* Navigation */}
          <button
            className={`${styles.lbArrow} ${styles.lbPrev}`}
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Imagen anterior"
          >
            ←
          </button>
          <button
            className={`${styles.lbArrow} ${styles.lbNext}`}
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Imagen siguiente"
          >
            →
          </button>

          {/* Close */}
          <button
            className={styles.lbClose}
            onClick={close}
            aria-label="Cerrar galería"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
