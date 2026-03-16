import RevealWrapper from '@/components/ui/RevealWrapper';
import styles from './StatementSection.module.css';

export default function StatementSection({ data }) {
  return (
    <section className={styles.statement} aria-label="Declaración">
      <div className={styles.container}>
        <RevealWrapper direction="up">
          <p className={styles.text}>
            <strong>{data.text_part1}</strong>
            {' '}
            <em>{data.text_part2_italic}</em>
            {' '}
            <em>{data.text_part3_italic}</em>
          </p>
          <span className={styles.sub}>{data.sub}</span>
        </RevealWrapper>
      </div>
    </section>
  );
}
