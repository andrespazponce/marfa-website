import Image from 'next/image';
import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './LagoonSection.module.css';

/**
 * LagoonSection — full-bleed image with parallax, overlaid headline.
 * The parallax effect is applied via CSS transform on scroll (client-side hook
 * added inline via a small <script> tag to keep this a Server Component).
 */
export default function LagoonSection({ data }) {
  return (
    <section className={styles.lagoon} id="lagoon" aria-labelledby="lagoon-heading">
      {/* Parallax image */}
      <div className={styles.imageBg} id="lagoon-parallax">
        <Image
          src={data.image_src}
          alt={data.image_alt}
          fill
          sizes="100vw"
          className={styles.img}
          priority={false}
        />
        <div className={styles.overlay} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <RevealWrapper direction="up">
          <span className={styles.eyebrow}>{data.eyebrow}</span>
          <h2 id="lagoon-heading" className={styles.headline}>
            {data.headline}
            <br />
            <em>{data.headline_line2}</em>
          </h2>
          <p className={styles.description}>{data.description}</p>
        </RevealWrapper>
      </div>

      {/* Inline parallax script — SSR-safe, tiny, no hydration needed */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var el = document.getElementById('lagoon-parallax');
              if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              window.addEventListener('scroll', function() {
                var rect = el.parentElement.getBoundingClientRect();
                var prog = -rect.top / (rect.height + window.innerHeight);
                el.style.transform = 'translateY(' + (prog * 80).toFixed(1) + 'px)';
              }, { passive: true });
            })();
          `,
        }}
      />
    </section>
  );
}
