import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;

  if (!value) {
    throw new Error('AUTH_SECRET is not set — copy .env.example to .env');
  }

  return value;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Stateless session token: `userId.expiry.signature`, HMAC-signed so it can't be forged. */
export function createSessionToken(userId: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) {
    return null;
  }

  const [userId, expiresAt, signature] = token.split('.');

  if (!userId || !expiresAt || !signature) {
    return null;
  }

  const payload = `${userId}.${expiresAt}`;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  if (Number(expiresAt) < Date.now()) {
    return null;
  }

  return userId;
}
