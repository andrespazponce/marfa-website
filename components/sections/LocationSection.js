import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './LocationSection.module.css';

/**
 * LocationSection — shows an embedded Google Map for MARFA
 * with a direct link to open in the Maps app on any device.
 */
export default function LocationSection({ data }) {
  return (
    <section className={styles.section} id="location" aria-labelledby="location-heading">
      <div className={styles.container}>

        {/* Header */}
        <RevealWrapper direction="up" className={styles.header}>
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 id="location-heading" className="section-headline">
            {data.headline} <em>{data.headline_italic}</em>
          </h2>
          <p className={styles.subline}>{data.subline}</p>
        </RevealWrapper>

        {/* Map + info row */}
        <RevealWrapper direction="up" delay={150} className={styles.mapWrapper}>

          {/* Google Maps iframe */}
          <div className={styles.mapFrame}>
            <iframe
              title="Ubicación MARFA"
              src={data.embed_url}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info panel */}
          <div className={styles.infoPanel}>
            <div className={styles.infoIcon} aria-hidden="true">📍</div>

            <h3 className={styles.infoTitle}>MARFA Camping &amp; Pesca</h3>

            <p className={styles.infoAddress}>{data.address}</p>

            <div className={styles.infoFeatures}>
              {data.features.map((f, i) => (
                <div key={i} className={styles.featureRow}>
                  <span className={styles.featureDot} aria-hidden="true" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <a
              href={data.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaMap}
            >
              <span className={styles.ctaIcon} aria-hidden="true">🗺️</span>
              Abrir en Google Maps →
            </a>

            <a
              href={`https://maps.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaNav}
            >
              <span className={styles.ctaIcon} aria-hidden="true">🧭</span>
              Cómo llegar →
            </a>
          </div>

        </RevealWrapper>
      </div>
    </section>
  );
}
