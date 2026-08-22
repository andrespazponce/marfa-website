import { getSiteConfig } from '@/lib/directus';
import VirtualTourViewer from '@/components/tour/VirtualTourViewer';

/**
 * Fase 2 — navegación real entre escenas vía hotspots.
 * Nodos de muestra (demo oficial de Photo Sphere Viewer) definidos en
 * lib/site-config.js → virtual_tour. Reemplazar por fotos reales de MARFA
 * y sus propios puntos marcados a mano (ver TRD.md §6) antes de lanzar.
 */
export default async function PaseoVirtualPage() {
  const config = await getSiteConfig();
  const { nodes, start_node_id } = config.virtual_tour;

  return (
    <VirtualTourViewer
      nodes={nodes}
      startNodeId={start_node_id}
      wordmark={config.site.name}
    />
  );
}
