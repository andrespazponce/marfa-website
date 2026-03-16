import Image from 'next/image';
import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './ExperiencesSection.module.css';

export default function ExperiencesSection({ data, site }) {
  const waHref = `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(site.whatsapp_greeting)}`;

  return (
    <section className={styles.experiences} id="experiences" aria-labelledby="experiences-heading">
      <div className={styles.container}>

        {/* Header */}
        <RevealWrapper direction="up" className={styles.header}>
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 id="experiences-heading" className="section-headline">
            {data.headline} <em>{data.headline_italic}</em>
          </h2>
          <p className={styles.subline}>{data.subline}</p>
        </RevealWrapper>

        {/* Cards grid */}
        <div className={styles.grid}>
          {data.items.map((item, i) => (
            <RevealWrapper
              key={item.number || i}
              direction="up"
              delay={i * 100}
              className={styles.cardWrapper}
            >
              <article className={styles.card}>
                {/* Image */}
                <div className={styles.cardImg}>
                  <Image
                    src={item.image_src}
                    alt={item.image_alt}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className={styles.cardImgInner}
                  />
                  <div className={styles.cardImgOverlay} />
                  <span className={styles.cardNumber} aria-hidden="true">{item.number}</span>
                </div>

                {/* Body */}
                <div className={styles.cardBody}>
                  <span className={styles.cardIcon} aria-hidden="true">{item.icon}</span>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDesc}>{item.description}</p>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardCta}
                  >
                    {item.cta_label}
                    <span aria-hidden="true"> →</span>
                  </a>
                </div>
              </article>
            </RevealWrapper>
          ))}
        </div>

      </div>
    </section>
  );
}
