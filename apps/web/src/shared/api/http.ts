/**
 * Cliente HTTP tipado con seguridad de Cookies HttpOnly y protección CSRF en memoria.
 * Respeta la directriz arquitectónica de GeoAlert: Cero tokens en localStorage.
 */

export interface ApiErrorResponse {
  statusCode?: number;
  message: string | string[];
  error?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Sesión expirada o no autorizada', details?: unknown) {
    super(401, message, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Acceso denegado: permisos insuficientes', details?: unknown) {
    super(403, message, details);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message = 'Datos de solicitud inválidos',
    public readonly validationErrors?: Record<string, string[]>,
  ) {
    super(422, message, validationErrors);
    this.name = 'ValidationError';
  }
}

// Token CSRF almacenado estrictamente en memoria (RAM), nunca en Storage
let inMemoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  inMemoryCsrfToken = token;
}

export function getCsrfToken(): string | null {
  return inMemoryCsrfToken;
}

/**
 * Obtiene el token CSRF fresco del backend (`GET /api/auth/csrf`)
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      inMemoryCsrfToken = data.csrfToken || data.token || null;
      return inMemoryCsrfToken;
    }
    return null;
  } catch (err) {
    console.warn('[HTTP] No se pudo obtener token CSRF:', err);
    return null;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `${window.location.origin}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
  );

  // Agregar query params si existen
  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
  }

  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  // Auto-cargar token CSRF para operaciones mutativas
  const isMutative = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (isMutative) {
    if (!inMemoryCsrfToken) {
      await fetchCsrfToken();
    }
    if (inMemoryCsrfToken) {
      headers.set('X-CSRF-Token', inMemoryCsrfToken);
    }
  }

  let bodyContent: BodyInit | null = null;
  if (options.body !== undefined && options.body !== null) {
    if (options.body instanceof FormData || options.body instanceof Blob) {
      bodyContent = options.body;
      // El navegador asigna el Content-Type adecuado con el boundary
    } else {
      headers.set('Content-Type', 'application/json');
      bodyContent = JSON.stringify(options.body);
    }
  }

  headers.set('Accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...options,
      method,
      headers,
      body: bodyContent,
      credentials: 'include', // Imprescindible para cookies HttpOnly
    });
  } catch (err: any) {
    throw new ApiError(0, err.message || 'Error de conexión de red');
  }

  // Si la respuesta fue exitosa
  if (response.ok) {
    if (response.status === 204) {
      return null as T;
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  // Manejo de errores de API tipados
  let errorData: ApiErrorResponse | null = null;
  try {
    errorData = await response.json();
  } catch {
    // Si no es JSON, captura texto plano
    const text = await response.text().catch(() => '');
    errorData = { message: text || response.statusText };
  }

  const rawMessage = errorData?.message;
  const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || response.statusText;

  switch (response.status) {
    case 401:
      throw new UnauthorizedError(message, errorData);
    case 403:
      throw new ForbiddenError(message, errorData);
    case 422:
      throw new ValidationError(message, errorData?.errors);
    default:
      throw new ApiError(response.status, message, errorData);
  }
}

export const http = {
  get: <T>(url: string, params?: Record<string, any>) => request<T>(url, { method: 'GET', params }),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
