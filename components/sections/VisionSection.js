import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './VisionSection.module.css';

export default function VisionSection({ data }) {
  return (
    <section className={styles.vision} id="vision" aria-labelledby="vision-heading">
      <div className={styles.container}>
        <RevealWrapper direction="up">
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 id="vision-heading" className="section-headline">
            {data.headline} <em>{data.headline_italic}</em>
          </h2>
          <p className={styles.text}>{data.text}</p>
          <div className={styles.badge}>{data.badge_label}</div>
        </RevealWrapper>
      </div>
    </section>
  );
}
