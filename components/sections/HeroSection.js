import AvailabilitySearchBar from '@/components/sections/AvailabilitySearchBar';
import { IconWaves, IconMapPin, IconLeaf, IconTent, IconSparkles } from '@/components/ui/Icons';
import styles from './HeroSection.module.css';

/**
 * HeroSection — full-screen video background with animated headline,
 * tag pills, the availability search bar, and a feature strip at the bottom.
 *
 * Server component — animation handled purely via CSS keyframes + inline delays.
 */
export default function HeroSection({ data, site }) {
  // Split headline into words for staggered animation
  const words1 = data.headline_line1.split(' ');
  const words2 = data.headline_line2_italic.split(' ');

  const featureStrip = [
    { Icon: IconWaves,    label: 'Laguna natural' },
    { Icon: IconMapPin,   label: site.location },
    { Icon: IconLeaf,     label: '19 ha' },
    { Icon: IconTent,     label: 'Camping' },
    { Icon: IconSparkles, label: 'Eventos privados' },
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

          {/* Tags */}
          <div className={styles.tags} aria-hidden="true">
            {data.subline_tags.map((tag, i) => (
              <span key={i} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom feature strip */}
      <div className={styles.strip} aria-hidden="true">
        {featureStrip.map((item, i) => (
          <div key={i} className={styles.stripItem}>
            <item.Icon className={styles.stripIcon} />
            <span className={styles.stripLabel}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Availability search bar — franja de ancho completo, debajo del strip */}
      <div className={styles.searchBand}>
        <div className={styles.searchBandInner}>
          <AvailabilitySearchBar site={site} />
        </div>
      </div>

      {/* Scroll cue */}
      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
