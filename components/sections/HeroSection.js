import styles from './HeroSection.module.css';

/**
 * HeroSection — full-screen video background with animated headline,
 * tag pills, dual CTAs, and a feature strip at the bottom.
 *
 * Server component — animation handled purely via CSS keyframes + inline delays.
 */
export default function HeroSection({ data, site }) {
  const waHref = `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(site.whatsapp_greeting)}`;

  // Split headline into words for staggered animation
  const words1 = data.headline_line1.split(' ');
  const words2 = data.headline_line2_italic.split(' ');

  const featureStrip = [
    { icon: '🌊', label: 'Laguna natural' },
    { icon: '📍', label: site.location },
    { icon: '🌿', label: '19 ha' },
    { icon: '⛺', label: 'Camping' },
    { icon: '✨', label: 'Eventos privados' },
  ];

  return (
    <section className={styles.hero} id="hero" aria-label="Inicio">
      {/* Video background */}
      <div className={styles.videoBg} aria-hidden="true">
        <video
          className={styles.video}
          src={data.video_src}
          poster={data.poster_src}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className={styles.overlay} />
        <div className={styles.vignette} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.container}>
          {/* Eyebrow */}
          <p className={styles.eyebrow}>{data.eyebrow}</p>

          {/* Animated headline */}
          <h1 className={styles.headline} aria-label={`${data.headline_line1} ${data.headline_line2_italic}`}>
            <span className={styles.line1}>
              {words1.map((word, i) => (
                <span
                  key={i}
                  className={styles.word}
                  style={{ animationDelay: `${1.3 + i * 0.15}s` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </span>
            <em className={styles.line2italic}>
              {words2.map((word, i) => (
                <span
                  key={i}
                  className={styles.word}
                  style={{ animationDelay: `${1.3 + (words1.length + i) * 0.15}s` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </em>
          </h1>

          {/* Tags */Р*/
          <div className={styles.tags} aria-hidden="true">
            {data.subline_tags.map((tag, i) => (
              <span key={i} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className={styles.ctas}>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>
              {data.cta_primary_label}
            </a>
            <a href="#experiences" className={styles.ctaSecondary}>
              {data.cta_secondary_label}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom feature strip */}
      <div className={styles.strip} aria-hidden="true">
        {featureStrip.map((item, i) => (
          <div key={i} className={styles.stripItem}>
            <span className={styles.stripIcon}>{item.icon}</span>
            <span className={styles.stripLabel}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Scroll cue */}
      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
