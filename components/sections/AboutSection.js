import Image from 'next/image';
import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './AboutSection.module.css';

export default function AboutSection({ data, site }) {
  const waHref = `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(site.whatsapp_greeting)}`;

  return (
    <section className={styles.about} id="about" aria-labelledby="about-heading">
      <div className={styles.container}>

        {/* Text column */}
        <div className={styles.textCol}>
          <RevealWrapper direction="left">
            <span className="section-eyebrow">{data.eyebrow}</span>
            <h2 id="about-heading" className="section-headline">
              {data.headline}{' '}
              <em>{data.headline_italic}</em>
            </h2>
            <p className={styles.lead}>{data.lead}</p>
            <p className={styles.body}>{data.body}</p>
          </RevealWrapper>

          {/* Stats */}
          <RevealWrapper direction="up" delay={200}>
            <div className={styles.stats} role="list">
              {data.stats.map((stat, i) => (
                <div key={i} className={styles.stat} role="listitem">
                  <span className={styles.statNumber}>{stat.number}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </RevealWrapper>

          <RevealWrapper direction="up" delay={350}>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.cta}>
              {data.cta_label}
              <span className={styles.ctaArrow} aria-hidden="true">→</span>
            </a>
          </RevealWrapper>
        </div>

        {/* Image column */}
        <RevealWrapper direction="right" className={styles.imageCol}>
          <div className={styles.imageWrap}>
            <Image
              src={data.image_src}
              alt={data.image_alt}
              width={700}
              height={900}
              className={styles.mainImg}
              sizes="(max-width: 900px) 100vw, 50vw"
            />
            {/* Badge overlay */}
            <div className={styles.badge} aria-hidden="true">
              <span className={styles.badgeNumber}>{data.badge_number}</span>
              <span className={styles.badgeLabel}>{data.badge_label}</span>
            </div>
          </div>
        </RevealWrapper>

      </div>
    </section>
  );
}
