import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './VideoSection.module.css';

export default function VideoSection({ data }) {
  return (
    <section className={styles.videoSection} id="video" aria-labelledby="video-heading">
      <div className={styles.container}>
        <RevealWrapper direction="up" className={styles.header}>
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 id="video-heading" className="section-headline">{data.headline}</h2>
          <p className={styles.description}>{data.description}</p>
        </RevealWrapper>

        <RevealWrapper direction="scale" delay={150} className={styles.videoWrap}>
          <video
            className={styles.video}
            src={data.video_src}
            poster={data.poster_src}
            controls
            preload="none"
            aria-label="Video aéreo de MARFA"
          />
          <div className={styles.playBtn} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
