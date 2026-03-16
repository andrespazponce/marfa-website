import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './WhySection.module.css';

export default function WhySection({ data }) {
  return (
    <section className={styles.why} id="why" aria-labelledby="why-heading">
      {/* Decorative clip-path separator */}
      <div className={styles.topShape} aria-hidden="true" />

      <div className={styles.container}>
        <RevealWrapper direction="up" className={styles.header}>
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 id="why-heading" className="section-headline">
            {data.headline} <em>{data.headline_italic}</em>
          </h2>
        </RevealWrapper>

        <div className={styles.grid}>
          {data.items.map((item, i) => (
            <RevealWrapper
              key={i}
              direction="up"
              delay={i * 80}
              className={styles.itemWrapper}
            >
              <div className={styles.item}>
                <span className={styles.icon} aria-hidden="true">{item.icon}</span>
                <div className={styles.itemText}>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  <p className={styles.itemDesc}>{item.description}</p>
                </div>
                <div className={styles.itemBar} aria-hidden="true" />
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
