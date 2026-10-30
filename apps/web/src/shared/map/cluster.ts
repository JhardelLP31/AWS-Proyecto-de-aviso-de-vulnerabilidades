import L from 'leaflet';
import 'leaflet.markercluster';
import type { Severity } from '@geoalert/contracts';
import { getWorstSeverity, SEVERITY_CONFIGS } from './severity-style';

export interface IncidentMarkerWithSeverity extends L.Marker {
  incidentSeverity?: Severity;
}

/**
 * Crea y configura el grupo de marcadores agrupados (Marker Cluster)
 * con semaforización reactiva: el clúster adopta el color y estilo
 * de la peor severidad contenida en su interior.
 */
export function createIncidentClusterGroup(): L.MarkerClusterGroup {
  return L.markerClusterGroup({
    maxClusterRadius: 45,
    showCoverageOnHover: false,
    iconCreateFunction: (cluster) => {
      const markers = cluster.getAllChildMarkers() as IncidentMarkerWithSeverity[];
      const severities: Severity[] = markers.map(
        (m) => m.incidentSeverity || 'GREEN',
      );

      const worst = getWorstSeverity(severities);
      const config = SEVERITY_CONFIGS[worst];
      const count = cluster.getChildCount();

      return L.divIcon({
        html: `<div class="custom-cluster-badge ${config.clusterClass}"><span>${count}</span></div>`,
        className: 'custom-cluster-wrapper',
        iconSize: L.point(40, 40),
      });
    },
  });
}
