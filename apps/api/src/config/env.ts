// Configuración tipada y validada una sola vez al arrancar (falla rápido si falta algo).

type IncidentsDriver = 'mock' | 'postgres';
type RealtimeDriver = 'inprocess' | 'redis';
type PhotoDriver = 'local' | 's3';

function read(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') throw new Error(`Variable de entorno requerida: ${name}`);
  return value;
}

function oneOf<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = (process.env[name] ?? fallback) as T;
  if (!allowed.includes(value)) throw new Error(`${name} debe ser uno de: ${allowed.join(', ')}`);
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

export const env = {
  nodeEnv,
  isProd,
  isLambda: Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME),
  port: Number(process.env.PORT ?? 3000),
  /** Origen del SPA. En producción se sirve SPA + API bajo el mismo dominio (CloudFront), así que CORS queda cerrado. */
  webOrigin: read('WEB_ORIGIN', 'http://localhost:5173'),
  jwtSecret: read('JWT_SECRET', isProd ? undefined : 'dev-only-secret-change-me-dev-only-secret'),
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 8 * 60 * 60),
  incidentsDriver: oneOf<IncidentsDriver>('INCIDENTS_DRIVER', ['mock', 'postgres'], 'mock'),
  realtimeDriver: oneOf<RealtimeDriver>('REALTIME_DRIVER', ['inprocess', 'redis'], 'inprocess'),
  photoDriver: oneOf<PhotoDriver>('PHOTO_DRIVER', ['local', 's3'], 'local'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  s3Bucket: process.env.S3_BUCKET ?? '',
  photoPublicBaseUrl: read('PHOTO_PUBLIC_BASE_URL', '/media'),
  localPhotoDir: process.env.LOCAL_PHOTO_DIR ?? './var/media',
  mockDatasetPath: process.env.MOCK_DATASET_PATH ?? './data/indeci-piura.json',
} as const;

if (env.isProd && env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción');
}

export const SESSION_COOKIE = env.isProd ? '__Host-ga_session' : 'ga_session';
export const CSRF_COOKIE = env.isProd ? '__Host-ga_csrf' : 'ga_csrf';
export const CSRF_HEADER = 'x-csrf-token';
