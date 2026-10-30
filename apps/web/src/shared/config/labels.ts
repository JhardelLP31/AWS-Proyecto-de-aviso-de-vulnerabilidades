import {
  INCIDENT_TYPES,
  SEVERITIES,
  INCIDENT_STATUSES,
  type IncidentType,
  type Severity,
  type IncidentStatus,
} from '@geoalert/contracts';

export interface TypeLabelInfo {
  label: string;
  icon: string;
  description: string;
}

export const INCIDENT_TYPE_LABELS: Record<IncidentType, TypeLabelInfo> = {
  RIVER_OVERFLOW: {
    label: 'Desborde de río',
    icon: '🌊',
    description: 'Crecida o salida del cauce del río Piura o afluentes',
  },
  BLIND_BASIN_COLLAPSE: {
    label: 'Cuenca ciega colapsada',
    icon: '🕳️',
    description: 'Acumulación crítica de agua de lluvia sin drenaje pluvial',
  },
  DIKE_BREACH: {
    label: 'Rotura de dique',
    icon: '🧱',
    description: 'Falla o colapso estructural en defensas ribereñas o diques',
  },
  ISOLATED_AREA: {
    label: 'Zona aislada',
    icon: '🏝️',
    description: 'Población sin acceso terrestre por inundación o anegamiento',
  },
  FLOODED_ROAD: {
    label: 'Vía inundada / intransitable',
    icon: '🚧',
    description: 'Calles, avenidas o carreteras bloqueadas por el agua',
  },
  LANDSLIDE: {
    label: 'Huaico / deslizamiento',
    icon: '⛰️',
    description: 'Flujo de lodo, piedras y escombros en pendientes',
  },
  OTHER: {
    label: 'Otro evento FEN',
    icon: '⚠️',
    description: 'Otra emergencia asociada al Fenómeno El Niño',
  },
};

export interface SeverityLabelInfo {
  label: string;
  badge: string;
  color: string;
  code: Severity;
}

export const SEVERITY_LABELS: Record<Severity, SeverityLabelInfo> = {
  GREEN: {
    label: 'Leve (Monitoreo)',
    badge: '🟢',
    color: '#22c55e',
    code: 'GREEN',
  },
  YELLOW: {
    label: 'Moderado (Atención)',
    badge: '🟡',
    color: '#eab308',
    code: 'YELLOW',
  },
  ORANGE: {
    label: 'Severo (Urgente)',
    badge: '🟠',
    color: '#f97316',
    code: 'ORANGE',
  },
  RED: {
    label: 'Crítico (Emergencia Máxima)',
    badge: '🔴',
    color: '#ef4444',
    code: 'RED',
  },
};

export interface StatusLabelInfo {
  label: string;
  badge: string;
  code: IncidentStatus;
}

export const STATUS_LABELS: Record<IncidentStatus, StatusLabelInfo> = {
  PENDING: {
    label: 'Pendiente de validación',
    badge: '⏳',
    code: 'PENDING',
  },
  VERIFIED: {
    label: 'Verificado en terreno',
    badge: '✅',
    code: 'VERIFIED',
  },
  RESOLVED: {
    label: 'Emergencia resuelta',
    badge: '🏁',
    code: 'RESOLVED',
  },
  DISMISSED: {
    label: 'Descartado / Falso',
    badge: '❌',
    code: 'DISMISSED',
  },
};

export const INCIDENT_TYPE_OPTIONS = INCIDENT_TYPES.map((type) => ({
  value: type,
  label: `${INCIDENT_TYPE_LABELS[type].icon} ${INCIDENT_TYPE_LABELS[type].label}`,
  icon: INCIDENT_TYPE_LABELS[type].icon,
}));

export const SEVERITY_OPTIONS = SEVERITIES.map((sev) => ({
  value: sev,
  label: `${SEVERITY_LABELS[sev].badge} ${SEVERITY_LABELS[sev].label}`,
  color: SEVERITY_LABELS[sev].color,
}));

export const STATUS_OPTIONS = INCIDENT_STATUSES.map((status) => ({
  value: status,
  label: `${STATUS_LABELS[status].badge} ${STATUS_LABELS[status].label}`,
}));
