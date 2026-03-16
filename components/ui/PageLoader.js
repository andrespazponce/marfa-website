'use client';

import { useEffect, useState } from 'react';

/**
 * PageLoader — full-screen overlay that fades out once the page is ready.
 * Shows the MARFA wordmark with an animated shimmer bar.
 */
export default function PageLoader({ wordmark = 'MARFA' }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="page-loader" className={hidden ? 'hidden' : ''}>
      <span className="loader-wordmark">{wordmark}</span>
      <div className="loader-bar" />
    </div>
  );
}
