/** Usuarios demo: los usa el store en memoria (modo mock) y el seed de Postgres. */
export const DEMO_USERS = [
  { id: '00000000-0000-4000-8000-000000000001', email: 'vecino@demo.pe', displayName: 'Vecina Castilla', reputation: 1, roles: ['vecino'] },
  { id: '00000000-0000-4000-8000-000000000002', email: 'brigadista@demo.pe', displayName: 'Brigada Catacaos', reputation: 1.5, roles: ['brigadista'] },
  { id: '00000000-0000-4000-8000-000000000003', email: 'coer@demo.pe', displayName: 'COER Piura', reputation: 2, roles: ['defensa_civil'] },
  { id: '00000000-0000-4000-8000-000000000004', email: 'admin@demo.pe', displayName: 'Administrador', reputation: 2, roles: ['admin'] },
] as const satisfies ReadonlyArray<{ id: string; email: string; displayName: string; reputation: number; roles: string[] }>;
