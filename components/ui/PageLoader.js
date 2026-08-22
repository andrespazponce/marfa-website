'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * PageLoader — full-screen overlay that fades out once the page is ready.
 * Shows the MARFA wordmark with an animated shimmer bar.
 */
export default function PageLoader({ wordmark = 'MARFA' }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // El paseo virtual 360° tiene su propia carga (ligada a cuándo la
  // panorámica termina de renderizar, ver VirtualTourViewer.js) — mostrar
  // esta además de esa sería una segunda carga redundante e injustificada.
  if (pathname === '/paseo-virtual') return null;

  return (
    <div id="page-loader" className={hidden ? 'hidden' : ''}>
      <span className="loader-wordmark">{wordmark}</span>
      <div className="loader-bar" />
    </div>
  );
}
