import RevealWrapper from '@/components/ui/RevealWrapper';
import BookingForm from './BookingForm';
import styles from './BookingSection.module.css';

/**
 * BookingSection — static shell + header.
 * BookingForm is a client component handling type selection and form state.
 */
export default function BookingSection({ data, site }) {
  return (
    <section className={styles.booking} id="booking" aria-labelledby="booking-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <RevealWrapper direction="up">
            <span className="section-eyebrow">{data.eyebrow}</span>
            <h2 id="booking-heading" className="section-headline">
              {data.headline} <em>{data.headline_italic}</em>
            </h2>
            <p className={styles.subline}>{data.subline}</p>
          </RevealWrapper>
        </div>

        <RevealWrapper direction="up" delay={150} className={styles.formWrapper}>
          <BookingForm data={data} site={site} />
        </RevealWrapper>
      </div>
    </section>
  );
}
