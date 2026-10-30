/**
 * Perfiles demo oficiales según docs/contratos.md
 * Contraseña única: GeoAlert2026!
 */

export interface DemoProfile {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  email: string;
  password: string;
  chipClass?: string;
}

export const DEMO_PASSWORD = 'GeoAlert2026!';

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'citizen',
    label: 'Vecino',
    sublabel: 'Reporte & Voto in situ',
    icon: '👤',
    email: 'vecino@demo.pe',
    password: DEMO_PASSWORD,
  },
  {
    id: 'brigade',
    label: 'Brigadista',
    sublabel: 'Bonus de Veracidad',
    icon: '🦺',
    email: 'brigadista@demo.pe',
    password: DEMO_PASSWORD,
    chipClass: 'brigade-chip',
  },
  {
    id: 'coer',
    label: 'COER Piura',
    sublabel: 'Despacho & Triaje',
    icon: '🏢',
    email: 'coer@demo.pe',
    password: DEMO_PASSWORD,
    chipClass: 'coer-chip',
  },
  {
    id: 'admin',
    label: 'Superadmin',
    sublabel: 'Acceso Total',
    icon: '⚡',
    email: 'admin@demo.pe',
    password: DEMO_PASSWORD,
    chipClass: 'admin-chip',
  },
];
