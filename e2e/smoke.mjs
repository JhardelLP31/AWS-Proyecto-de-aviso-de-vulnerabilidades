// Prueba de humo extremo a extremo contra una API levantada (mock o postgres).
//   API_URL=http://localhost:3000 node e2e/smoke.mjs
// Sale con código 1 al primer fallo. Sin dependencias: fetch nativo de Node 22.
import assert from 'node:assert/strict';

const API = process.env.API_URL ?? 'http://localhost:3000';
const ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

class Client {
  cookies = new Map();
  csrf = null;
  async req(method, path, body) {
    const headers = { origin: ORIGIN, cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ') };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (this.csrf) headers['x-csrf-token'] = this.csrf;
    const res = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const [k, v] = pair.split('=');
      if (v) this.cookies.set(k, v);
      else this.cookies.delete(k);
    }
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }
  async login(email, password = 'GeoAlert2026!') {
    const r = await this.req('POST', '/api/auth/login', { email, password });
    assert.equal(r.status, 200, `login ${email}: ${JSON.stringify(r.body)}`);
    this.csrf = r.body.csrfToken;
    return r.body.user;
  }
}

const step = async (name, fn) => {
  try {
    await fn();
    console.log(`✔ ${name}`);
  } catch (err) {
    console.error(`✘ ${name}\n  ${err.message}`);
    process.exit(1);
  }
};

const anon = new Client();
const vecino = new Client();
const brigada = new Client();
const coer = new Client();
const nuevo = new Client();
const HERE = { lat: -5.1945, lng: -80.6328 };
let incident;

await step('health', async () => assert.equal((await anon.req('GET', '/health')).status, 200));

await step('mapa público por bbox', async () => {
  const r = await anon.req('GET', '/api/incidents?bbox=-81.5,-6.5,-79,-4');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body));
});

await step('bbox inválido → 400', async () => {
  assert.equal((await anon.req('GET', '/api/incidents?bbox=1,2,3')).status, 400);
});

await step('registro con contraseña débil → 400', async () => {
  const r = await nuevo.req('POST', '/api/auth/register', { email: `x${Date.now()}@demo.pe`, password: 'corta', displayName: 'X' });
  assert.equal(r.status, 400);
});

await step('registro válido nace como vecino', async () => {
  const r = await nuevo.req('POST', '/api/auth/register', {
    email: `vecino.${Date.now()}@demo.pe`,
    password: 'PiuraSegura2026',
    displayName: 'Vecino Nuevo',
    phone: '987654321',
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.deepEqual(r.body.user.roles, ['vecino']);
  nuevo.csrf = r.body.csrfToken;
});

await step('logins demo', async () => {
  await vecino.login('vecino@demo.pe');
  await brigada.login('brigadista@demo.pe');
  await coer.login('coer@demo.pe');
});

await step('reportar incidente (JSON sin fotos no es multipart → usa form)', async () => {
  const form = new FormData();
  for (const [k, v] of Object.entries({ type: 'DIKE_BREACH', severity: 'RED', title: 'Rotura de dique', description: 'Filtración fuerte en el dique de Castilla', lat: HERE.lat, lng: HERE.lng })) form.append(k, String(v));
  const res = await fetch(`${API}/api/incidents`, {
    method: 'POST',
    headers: { origin: ORIGIN, 'x-csrf-token': vecino.csrf, cookie: [...vecino.cookies].map(([k, v]) => `${k}=${v}`).join('; ') },
    body: form,
  });
  const body = await res.json();
  assert.equal(res.status, 201, JSON.stringify(body));
  assert.equal(body.status, 'PENDING');
  incident = body;
});

await step('sin token CSRF → 403', async () => {
  const csrf = brigada.csrf;
  brigada.csrf = null;
  const r = await brigada.req('POST', `/api/incidents/${incident.id}/votes`, { kind: 'CONFIRM', ...HERE, accuracyM: 10 });
  brigada.csrf = csrf;
  assert.equal(r.status, 403);
});

await step('autovoto → 403', async () => {
  const r = await vecino.req('POST', `/api/incidents/${incident.id}/votes`, { kind: 'CONFIRM', ...HERE, accuracyM: 10 });
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'SELF_VOTE_NOT_ALLOWED');
});

await step('geocerca → 422', async () => {
  const r = await brigada.req('POST', `/api/incidents/${incident.id}/votes`, { kind: 'CONFIRM', lat: -5.0, lng: -80.0, accuracyM: 10 });
  assert.equal(r.status, 422);
  assert.equal(r.body.code, 'GEOFENCE_VIOLATION');
});

await step('brigadista + COER confirman → VERIFIED', async () => {
  const a = await brigada.req('POST', `/api/incidents/${incident.id}/votes`, { kind: 'CONFIRM', ...HERE, accuracyM: 10 });
  assert.equal(a.status, 201, JSON.stringify(a.body));
  const b = await coer.req('POST', `/api/incidents/${incident.id}/votes`, { kind: 'CONFIRM', ...HERE, accuracyM: 10 });
  assert.equal(b.body.status, 'VERIFIED', JSON.stringify(b.body));
  incident = b.body;
});

await step('vecino sin triage.update → 403', async () => {
  const r = await vecino.req('PATCH', `/api/incidents/${incident.id}/triage`, { severity: 'ORANGE', expectedVersion: incident.version });
  assert.equal(r.status, 403);
});

await step('triaje COER con versión correcta / vieja', async () => {
  const ok = await coer.req('PATCH', `/api/incidents/${incident.id}/triage`, { status: 'RESOLVED', expectedVersion: incident.version });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const stale = await coer.req('PATCH', `/api/incidents/${incident.id}/triage`, { severity: 'GREEN', expectedVersion: incident.version });
  assert.equal(stale.status, 409);
});

await step('campo no permitido → 400', async () => {
  const r = await coer.req('PATCH', `/api/incidents/${incident.id}/triage`, { severity: 'RED', expectedVersion: 99, hack: true });
  assert.equal(r.status, 400);
});

await step('logout cierra la sesión', async () => {
  assert.equal((await vecino.req('POST', '/api/auth/logout')).status, 204);
  vecino.csrf = null;
  assert.equal((await vecino.req('GET', '/api/auth/me')).status, 401);
});

console.log('\nTodas las pruebas de humo pasaron.');
