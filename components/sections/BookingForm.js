'use client';

import { useState } from 'react';
import styles from './BookingForm.module.css';

export default function BookingForm({ data, site }) {
  const [selectedType, setSelectedType] = useState(data.options[0]?.key || '');
  const [submitted, setSubmitted]       = useState(false);

  const waHref = `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(site.whatsapp_greeting)}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const name  = form.name?.value  || '';
    const date  = form.date?.value  || '';
    const guests= form.guests?.value|| '';
    const notes = form.notes?.value || '';
    const typeLabel = data.options.find(o => o.key === selectedType)?.label || selectedType;
    const msg = [
      `Hola, me gustaría reservar en MARFA.`,
      `Tipo: ${typeLabel}`,
      name  ? `Nombre: ${name}` : '',
      date  ? `Fecha: ${date}` : '',
      guests? `Personas: ${guests}` : '',
      notes ? `Notas: ${notes}` : '',
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className={styles.wrap}>
      <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.waCta}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        {data.whatsapp_cta}
      </a>
      {submitted ? (<div className={styles.success} role="status"><span>✓</span><p>©Gracias!</p><button onClick={() => setSubmitted(false)}>Nueva consulta</button></div>) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <fieldset className={styles.typeGroup}><legend className={styles.typeLabel}>¡Qué te interesa?</legend><div className={styles.typeOptions}>{data.options.map(opt => (<label key={opt.key} className={`${styles.typeOpt} ${selectedType === opt.key ? styles.typeOptActive : ''}`}><input type="radio" name="booking_type" value={opt.key} checked={selectedType === opt.key} onChange={() => setSelectedType(opt.key)} className={styles.radioHidden} /><span aria-hidden="true">{opt.icon}</span><span>{opt.label}</span></label>))}</div></fieldset>
          <div className={styles.fields}><label className={styles.field}><span className={styles.fieldLabel}>Nombre</span><input type="text" name="name" className={styles.input} placeholder="Tu nombre" required /></label><label className={styles.field}><span className={styles.fieldLabel}>Fecha</span><input type="date" name="date" className={styles.input} /></label><label className={styles.field}><span className={styles.fieldLabel}>Número</span><input type="number" name="guests" className={styles.input} placeholder="Ej. 10" min="1" /></label><label className={`${styles.field} ${styles.fieldFull}`}><span className={styles.fieldLabel}>Mensaje</span><textarea name="notes" className={`${styles.input} ${styles.textarea}`} placeholder="Cuéntanos más..." rows={4} /></label></div>
          <button type="submit" className={styles.submit}>{data.form_submit_label}</button>
        </form>
      )}
    </div>
  );
}
