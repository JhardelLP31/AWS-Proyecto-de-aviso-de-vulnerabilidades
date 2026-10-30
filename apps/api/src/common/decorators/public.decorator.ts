import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'rbac:public';

/** Ruta accesible sin sesión (login, health, lectura pública del mapa). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
