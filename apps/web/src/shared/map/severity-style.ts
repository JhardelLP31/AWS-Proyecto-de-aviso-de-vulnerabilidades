import type { Severity } from '@geoalert/contracts';

export interface SeverityConfig {
  color: string;
  glowColor: string;
  label: string;
  shortLabel: string;
  badgeClass: string;
  clusterClass: string;
  order: number;
}

export const SEVERITY_CONFIGS: Record<Severity, SeverityConfig> = {
  RED: {
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    label: 'Rojo · Crítico (Rotura de Dique / Desborde)',
    shortLabel: 'Crítico',
    badgeClass: 'badge-red',
    clusterClass: 'cluster-red',
    order: 4,
  },
  ORANGE: {
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    label: 'Naranja · Grave (Cuenca Ciega Colapsada)',
    shortLabel: 'Grave',
    badgeClass: 'badge-orange',
    clusterClass: 'cluster-orange',
    order: 3,
  },
  YELLOW: {
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    label: 'Amarillo · Moderado (Encharcamiento / Alerta)',
    shortLabel: 'Moderado',
    badgeClass: 'badge-yellow',
    clusterClass: 'cluster-yellow',
    order: 2,
  },
  GREEN: {
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    label: 'Verde · Normal / Controlado',
    shortLabel: 'Normal',
    badgeClass: 'badge-green',
    clusterClass: 'cluster-green',
    order: 1,
  },
};

export function getSeverityColor(sev: Severity | string): string {
  const s = (sev || 'GREEN').toUpperCase() as Severity;
  return SEVERITY_CONFIGS[s]?.color || '#10b981';
}

export function getSeverityLabel(sev: Severity | string): string {
  const s = (sev || 'GREEN').toUpperCase() as Severity;
  return SEVERITY_CONFIGS[s]?.label || sev;
}

export function getSeverityBadgeClass(sev: Severity | string): string {
  const s = (sev || 'GREEN').toUpperCase() as Severity;
  return SEVERITY_CONFIGS[s]?.badgeClass || 'badge-green';
}

export function getWorstSeverity(severities: (Severity | string)[]): Severity {
  let worst: Severity = 'GREEN';
  let maxOrder = 0;

  for (const item of severities) {
    const s = (item || 'GREEN').toUpperCase() as Severity;
    const order = SEVERITY_CONFIGS[s]?.order || 0;
    if (order > maxOrder) {
      maxOrder = order;
      worst = s;
    }
  }

  return worst;
}
