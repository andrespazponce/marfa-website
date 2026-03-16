'use client';

import { useEffect, useRef } from 'react';

export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const onScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollTotal = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollTotal > 0 ? (scrollTop / scrollTotal) * 100 : 0;
      bar.style.width = `${progress}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div id="scroll-progress" ref={barRef} aria-hidden="true" />;
}
