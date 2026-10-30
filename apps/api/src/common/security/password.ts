import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// scrypt nativo de Node: sin binarios nativos (bcrypt/argon2) que compliquen el empaquetado para Lambda.
const KEY_LEN = 64;
const PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_LEN, PARAMS, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Formato: scrypt$<saltB64>$<hashB64> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await derive(password, Buffer.from(saltB64, 'base64'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Hash fijo para comparar cuando el email no existe y no filtrar usuarios por tiempo de respuesta. */
export const DUMMY_PASSWORD_HASH =
  'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
