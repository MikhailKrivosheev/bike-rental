import { createHash, randomInt } from 'node:crypto';

export const CODE_LENGTH = 6;
export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

/**
 * Temporary test bypass until Resend delivers real codes. It is refused in
 * production builds unless ALLOW_DEV_OTP is explicitly set, so it can never
 * quietly reach a deployed environment.
 */
const DEV_CODE = '111111';

export function devCodeAllowed() {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP === 'true';
}

export function generateCode() {
  return randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, '0');
}

export function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

export function codeMatches(submitted: string, codeHash: string) {
  return codeHash === hashCode(submitted) || (devCodeAllowed() && submitted === DEV_CODE);
}
