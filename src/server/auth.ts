'use server';

import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { routing } from '@/i18n/routing';
import { CODE_TTL_MINUTES, MAX_ATTEMPTS, codeMatches, generateCode, hashCode } from 'Lib/otp';
import { verifyPassword } from 'Lib/password';
import { prisma } from 'Lib/prisma';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, verifySessionToken } from 'Lib/session';
import { sendLoginCode } from '@/server/email';

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignInInput = z.input<typeof signInSchema>;

export type SignInResult = { ok: true } | { ok: false; error: string };

function resolveLocale(requested: string) {
  return hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
}

export async function startSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function signIn(input: SignInInput, requestedLocale: string): Promise<SignInResult> {
  const locale = resolveLocale(requestedLocale);
  const translateError = await getTranslations({ locale, namespace: 'Header.errors' });
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: translateError('invalidCredentials') };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: translateError('invalidCredentials') };
  }

  await startSession(user.id);

  return { ok: true };
}

const requestLoginCodeSchema = z.object({ email: z.email() });

export type RequestLoginCodeResult = { ok: true } | { ok: false; error: string };

/**
 * Lets a booking guest — someone who has never set a password — into "My
 * bookings" with the same email + one-time-code flow used at checkout,
 * instead of requiring registration just to see what they already booked.
 */
export async function requestLoginCode(email: string, requestedLocale: string): Promise<RequestLoginCodeResult> {
  const locale = resolveLocale(requestedLocale);
  const translateError = await getTranslations({ locale, namespace: 'Header.errors' });
  const parsed = requestLoginCodeSchema.safeParse({ email });

  if (!parsed.success) {
    return { ok: false, error: translateError('invalidEmail') };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (!user) {
    return { ok: false, error: translateError('noAccount') };
  }

  const code = generateCode();

  await prisma.loginCode.create({
    data: {
      userId: user.id,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  await sendLoginCode({ to: user.email, code });

  return { ok: true };
}

const verifyLoginCodeSchema = z.object({ email: z.email(), code: z.string().min(1) });

export type VerifyLoginCodeInput = z.input<typeof verifyLoginCodeSchema>;

export type VerifyLoginCodeResult = { ok: true } | { ok: false; error: string };

export async function verifyLoginCode(
  input: VerifyLoginCodeInput,
  requestedLocale: string,
): Promise<VerifyLoginCodeResult> {
  const locale = resolveLocale(requestedLocale);
  const translateError = await getTranslations({ locale, namespace: 'Header.errors' });
  const parsed = verifyLoginCodeSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: translateError('invalidCredentials') };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const loginCode = user
    ? await prisma.loginCode.findFirst({
        where: { userId: user.id, consumedAt: null },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  if (!user || !loginCode || loginCode.expiresAt < new Date()) {
    return { ok: false, error: translateError('codeExpired') };
  }

  if (loginCode.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: translateError('tooManyAttempts') };
  }

  if (!codeMatches(parsed.data.code.trim(), loginCode.codeHash)) {
    await prisma.loginCode.update({
      where: { id: loginCode.id },
      data: { attempts: { increment: 1 } },
    });

    return { ok: false, error: translateError('wrongCode') };
  }

  await prisma.loginCode.update({
    where: { id: loginCode.id },
    data: { consumedAt: new Date() },
  });

  await startSession(user.id);

  return { ok: true };
}

export async function signOut() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const userId = verifySessionToken(store.get(SESSION_COOKIE)?.value);

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({ where: { id: userId } });
}
