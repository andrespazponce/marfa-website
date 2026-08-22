'use client';

import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import styles from './VirtualTourViewer.module.css';

export default function VirtualTourViewer({ nodes, startNodeId, wordmark = 'MARFA' }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const tourRef = useRef(null);
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
  // Reemplaza al PageLoader global en esta página (ver PageLoader.js) — se
  // oculta recién cuando el visor dispara 'ready', es decir, cuando la
  // primera panorámica ya terminó de descargar y renderizar. Evita la doble
  // carga (marca MARFA + spinner del visor) que se veía antes.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    viewerRef.current = new Viewer({
      container: containerRef.current,
      navbar: ['zoom', 'caption', 'fullscreen'],
      loadingTxt: 'Cargando panorámica…',
      plugins: [
        MarkersPlugin,
        VirtualTourPlugin.withConfig({
          positionMode: 'manual',
          renderMode: '3d',
          dataMode: 'client',
          nodes,
          startNodeId,
          // Descarga en segundo plano las panorámicas de las escenas conectadas
          // mientras el visitante mira la actual, para que la transición al
          // hacer clic sea instantánea en vez de mostrar "Cargando…" recién ahí.
          preload: true,
        }),
      ],
    });

    tourRef.current = viewerRef.current.getPlugin(VirtualTourPlugin);
    tourRef.current.addEventListener('node-changed', ({ node }) => setCurrentNodeId(node.id));
    // 'ready' se dispara una sola vez, cuando la panorámica inicial ya está
    // renderizada — no vuelve a dispararse en transiciones posteriores.
    viewerRef.current.addEventListener('ready', () => setReady(true));

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
      tourRef.current = null;
    };
  }, [nodes, startNodeId]);

  const goToScene = (id) => {
    tourRef.current?.setCurrentNode(id);
  };

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.viewer} />
      <div className={styles.sceneMenu}>
        {nodes.map((n) => (
          <button
            key={n.id}
            className={`${styles.sceneBtn} ${n.id === currentNodeId ? styles.sceneBtnActive : ''}`}
            onClick={() => goToScene(n.id)}
          >
            {n.name}
          </button>
        ))}
      </div>
      <div id="page-loader" className={ready ? 'hidden' : ''}>
        <span className="loader-wordmark">{wordmark}</span>
        <div className="loader-bar" />
      </div>
    </div>
  );
}
