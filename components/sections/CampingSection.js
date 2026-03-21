import Image from 'next/image';
import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './CampingSection.module.css';

export default function CampingSection({ data, site }) {
  const waHref = `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent('Hola, quisiera información sobre el Camping VIP en MARFA')}`;

  return (
    <section className={styles.section} id="camping" aria-labelledby="camping-heading">
      <div className={styles.container}>
        <div className={styles.grid}>

          {/* ── Text side ───────────────────────────────────────────── */}
          <div className={styles.textCol}>
            <RevealWrapper direction="up">
              <span className="section-eyebrow">{data.eyebrow}</span>
            </RevealWrapper>
            <RevealWrapper direction="up" delay={80}>
              <h2 id="camping-heading" className="section-headline" style={{ marginTop: '0.75rem' }}>
                {data.headline} <em>{data.headline_italic}</em>
              </h2>
            </RevealWrapper>
            <RevealWrapper direction="up" delay={160}>
              <p className={styles.description}>{data.description}</p>
            </RevealWrapper>

            <div className={styles.features}>
              {data.features.map((f, i) => (
                <RevealWrapper key={f.title} direction="up" delay={200 + i * 60} className={styles.featureItem}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <div>
                    <p className={styles.featureTitle}>{f.title}</p>
                    <p className={styles.featureDesc}>{f.desc}</p>
                  </div>
                </RevealWrapper>
              ))}
            </div>

            <RevealWrapper direction="up" delay={400} className={styles.ctaRow}>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>
                {data.cta_label}
              </a>
              <a href="#booking" className={styles.ctaSecondary}>Formulario →</a>
            </RevealWrapper>
          </div>

          {/* ── Media side ──────────────────────────────────────────── */}
          <RevealWrapper direction="up" delay={100} className={styles.mediaCol}>
            {/* Main cover photo */}
            <div className={styles.mediaMain}>
              <Image
                src={`/assets/areas/${data.cover}`}
                alt="Camping VIP MARFA"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className={styles.mediaMainImg}
              />
            </div>

            {/* Secondary row */}
            <div className={styles.mediaRow}>
              <div className={styles.mediaSide}>
                <Image
                  src={`/assets/areas/${data.photo2}`}
                  alt="Camping VIP MARFA"
                  fill
                  sizes="25vw"
                  className={styles.mediaSideImg}
                />
              </div>
              <div className={styles.mediaSideVideo}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={styles.mediaSideVid}
                  aria-hidden="true"
                >
                  <source src={`/assets/areas/${data.video}`} type="video/mp4" />
                </video>
              </div>
            </div>
          </RevealWrapper>

        </div>
      </div>
    </section>
  );
}
