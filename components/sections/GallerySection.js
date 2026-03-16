import RevealWrapper from '@/components/ui/RevealWrapper';
import GalleryGrid from './GalleryGrid';
import styles from './GallerySection.module.css';

/**
 * GallerySection — static shell + header.
 * GalleryGrid is a client component that handles lightbox interactivity.
 */
export default function GallerySection({ data }) {
  return (
    <section className={styles.gallery} id="gallery" aria-labelledby="gallery-heading">
      <div className={styles.container}>
        <RevealWrapper direction="up" className={styles.header}>
          <span className="section-eyebrow">{data.eyebrow}</span>
          <h2 id="gallery-heading" className="section-headline">
            {data.headline} <em>{data.headline_italic}</em>
          </h2>
        </RevealWrapper>
      </div>

      {/* Client component for interactive mosaic + lightbox */}
      <GalleryGrid items={data.items} />
    </section>
  );
}
