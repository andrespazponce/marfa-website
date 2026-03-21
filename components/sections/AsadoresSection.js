'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './AsadoresSection.module.css';

export default function AsadoresSection({ data, site }) {
  const [activeArea, setActiveArea] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const waHref = `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent('Hola, quisiera reservar un asador en MARFA')}`;

  const closeModal = useCallback(() => {
    setActiveArea(null);
    setLightboxIdx(null);
    document.body.style.overflow = '';
  }, []);

  const openModal = useCallback((area) => {
    setActiveArea(area);
    setLightboxIdx(null);
    document.body.style.overflow = 'hidden';
  }, []);

  const openLightbox = useCallback((idx) => {
    setLightboxIdx(idx);
  }, []);

  const prevPhoto = useCallback((e) => {
    e.stopPropagation();
    setLightboxIdx(i => (i - 1 + activeArea.photos.length) % activeArea.photos.length);
  }, [activeArea]);

  const nextPhoto = useCallback((e) => {
    e.stopPropagation();
    setLightboxIdx(i => (i + 1) % activeArea.photos.length);
  }, [activeArea]);

  useEffect(() => {
    const onKey = (e) => {
      if (!activeArea) return;
      if (e.key === 'Escape') {
        if (lightboxIdx !== null) setLightboxIdx(null);
        else closeModal();
      }
      if (lightboxIdx !== null) {
        if (e.key === 'ArrowLeft')  prevPhoto(e);
        if (e.key === 'ArrowRight') nextPhoto(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeArea, lightboxIdx, closeModal, prevPhoto, nextPhoto]);

  return (
    <>
      <section className={styles.section} id="asadores" aria-labelledby="asadores-heading">
        <div className={styles.container}>
          <RevealWrapper direction="up" className={styles.header}>
            <span className="section-eyebrow">{data.eyebrow}</span>
            <h2 id="asadores-heading" className="section-headline">
              {data.headline} <em>{data.headline_italic}</em>
            </h2>
            <p className={styles.subline}>{data.subline}</p>
          </RevealWrapper>
        </div>

        <div className={styles.grid}>
          {data.items.map((area, i) => (
            <RevealWrapper key={area.id} direction="up" delay={i * 60} className={styles.cardWrapper}>
              <button
                className={styles.card}
                onClick={() => openModal(area)}
                aria-label={`Ver galería de ${area.name}`}
              >
                <div className={styles.cardImg}>
                  <Image
                    src={`/assets/areas/${area.cover}`}
                    alt={area.name}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
                    className={styles.cardImgInner}
                  />
                  <div className={styles.cardOverlay} />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardNum}>{area.number}</span>
                  <h3 className={styles.cardName}>{area.name}</h3>
                  <span className={styles.cardCta}>Ver galería →</span>
                </div>
              </button>
            </RevealWrapper>
          ))}
        </div>

        <div className={styles.bottomCta}>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
            {data.cta_reserve}
          </a>
        </div>
      </section>

      {/* ── Area Modal ─────────────────────────────────────────────── */}
      {activeArea && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-label={activeArea.name}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className={styles.modalInner}>
            <button className={styles.modalClose} onClick={closeModal} aria-label="Cerrar">✕</button>

            <div className={styles.modalHeader}>
              <span className={styles.modalEyebrow}>Asador · MARFA</span>
              <h2 className={styles.modalTitle}>{activeArea.name}</h2>
              <div className={styles.modalRule} />
            </div>

            <div className={styles.modalGallery}>
              {activeArea.photos.map((photo, i) => (
                <button
                  key={photo}
                  className={`${styles.modalPhotoBtn} ${i === 0 ? styles.modalPhotoMain : ''}`}
                  onClick={() => openLightbox(i)}
                  aria-label={`Ampliar foto ${i + 1}`}
                >
                  <Image
                    src={`/assets/areas/${photo}`}
                    alt={`${activeArea.name} — foto ${i + 1}`}
                    fill
                    sizes="(max-width: 700px) 100vw, 50vw"
                    className={styles.modalPhotoImg}
                  />
                </button>
              ))}
            </div>

            <div className={styles.modalActions}>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.modalBookBtn}>
                Reservar este asador →
              </a>
              <a href="#booking" className={styles.modalSecondaryBtn} onClick={closeModal}>
                Formulario de reserva
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Lightbox ─────────────────────────────────────────── */}
      {activeArea && lightboxIdx !== null && (
        <div
          className={styles.lightbox}
          onClick={() => setLightboxIdx(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
        >
          <button className={styles.lbClose} onClick={() => setLightboxIdx(null)} aria-label="Cerrar">✕</button>
          <button className={styles.lbPrev} onClick={prevPhoto} aria-label="Anterior">‹</button>
          <div className={styles.lbImgWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              src={`/assets/areas/${activeArea.photos[lightboxIdx]}`}
              alt={`${activeArea.name} — foto ${lightboxIdx + 1}`}
              fill
              className={styles.lbImg}
              sizes="90vw"
            />
          </div>
          <button className={styles.lbNext} onClick={nextPhoto} aria-label="Siguiente">›</button>
          <p className={styles.lbCounter}>{lightboxIdx + 1} / {activeArea.photos.length}</p>
        </div>
      )}
    </>
  );
}
