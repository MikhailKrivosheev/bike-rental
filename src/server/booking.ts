'use server';

import { createHash, randomInt } from 'node:crypto';

import { getLocale, getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { BikeStatus, RentalStatus } from '@/generated/prisma/enums';
import { PICKUP_HOUR, accessoryIds, isRentalDuration, rentalPrice } from '@/lib/rental';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode } from '@/server/email';

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export type BookingResult =
  | { ok: true; rentalId: string }
  | { ok: false; error: string };

export type VerificationResult =
  | { ok: true; endsAt: string }
  | { ok: false; error: string };

const bookingSchema = z.object({
  bikeId: z.string().min(1),
  date: z.iso.date(),
  hours: z.number().int().refine(isRentalDuration),
  accessories: z.array(z.enum(accessoryIds as [string, ...string[]])).default([]),
  email: z.email(),
});

export type BookingInput = z.input<typeof bookingSchema>;

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

function startOfRental(date: string) {
  const startsAt = new Date(`${date}T00:00:00`);
  startsAt.setHours(PICKUP_HOUR, 0, 0, 0);
  return startsAt;
}

/**
 * Creates a pending rental and emails a one-time code. The rental only becomes
 * active — and the bike unavailable — once the code is confirmed.
 */
export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const t = await getTranslations('Booking.errors');
  const parsed = bookingSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: t('invalidInput') };
  }

  const { bikeId, date, hours, accessories, email } = parsed.data;

  const startsAt = startOfRental(date);
  const endsAt = new Date(startsAt.getTime() + hours * 60 * 60 * 1000);

  if (endsAt <= new Date()) {
    return { ok: false, error: t('pastDate') };
  }

  const bike = await prisma.bike.findUnique({ where: { id: bikeId } });

  if (!bike) {
    return { ok: false, error: t('bikeNotFound') };
  }

  if (bike.status !== BikeStatus.AVAILABLE) {
    return { ok: false, error: t('bikeUnavailable') };
  }

  // Prices always come from the database, never from the submitted form.
  const totalPrice = rentalPrice(bike.pricePerHour, hours, accessories);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split('@')[0] },
  });

  const code = randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, '0');

  const rental = await prisma.rental.create({
    data: {
      userId: user.id,
      bikeId: bike.id,
      status: RentalStatus.PENDING,
      startsAt,
      endsAt,
      accessories,
      totalPrice,
      verification: {
        create: {
          codeHash: hashCode(code),
          expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
        },
      },
    },
  });

  await sendVerificationCode({ to: email, code, bikeModel: bike.model });

  return { ok: true, rentalId: rental.id };
}

export async function confirmBooking(rentalId: string, code: string): Promise<VerificationResult> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('Booking.errors')]);

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { verification: true, bike: true },
  });

  if (!rental?.verification || rental.status !== RentalStatus.PENDING) {
    return { ok: false, error: t('bookingNotFound') };
  }

  const { verification } = rental;

  if (verification.consumedAt || verification.expiresAt < new Date()) {
    return { ok: false, error: t('codeExpired') };
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: t('tooManyAttempts') };
  }

  if (verification.codeHash !== hashCode(code.trim())) {
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });

    return { ok: false, error: t('wrongCode') };
  }

  await prisma.$transaction([
    prisma.verificationCode.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() },
    }),
    prisma.rental.update({
      where: { id: rental.id },
      data: { status: RentalStatus.ACTIVE },
    }),
    prisma.bike.update({
      where: { id: rental.bikeId },
      data: { status: BikeStatus.RENTED },
    }),
  ]);

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/bikes/${rental.bikeId}`);

  return { ok: true, endsAt: rental.endsAt.toISOString() };
}
