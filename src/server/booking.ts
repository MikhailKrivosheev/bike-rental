"use server";

import { createHash, randomInt } from "node:crypto";

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { updateTag } from "next/cache";
import { z } from "zod";

import { BikeStatus, RentalStatus } from "@/generated/prisma/enums";
import { routing } from "@/i18n/routing";
import {
  MAX_DAYS,
  MAX_HOURS,
  MIN_HOURS,
  accessoryIds,
  daysBetween,
  pickupTimes,
  quoteRental,
} from "Lib/rental";
import { prisma } from "Lib/prisma";
import { BIKES_TAG } from "@/server/catalogue";
import { sendVerificationCode } from "@/server/email";

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/**
 * Temporary test bypass until Resend delivers the real codes. It is refused in
 * production builds unless ALLOW_DEV_OTP is explicitly set, so it can never
 * quietly reach a deployed environment.
 */
const DEV_CODE = "111111";

function devCodeAllowed() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_OTP === "true"
  );
}

export type BookingResult =
  { ok: true; rentalId: string } | { ok: false; error: string };

export type VerificationResult =
  { ok: true; startsAt: string; endsAt: string } | { ok: false; error: string };

const bookingSchema = z.object({
  bikeId: z.string().min(1),
  date: z.iso.date(),
  endDate: z.iso.date().optional(),
  time: z.enum(pickupTimes as [string, ...string[]]),
  hours: z.number().int().min(MIN_HOURS).max(MAX_HOURS),
  accessories: z
    .array(z.enum(accessoryIds as [string, ...string[]]))
    .default([]),
  email: z.email(),
});

export type BookingInput = z.input<typeof bookingSchema>;

/** Server Actions can't read `next/root-params`, so the client passes the locale in. */
function resolveLocale(requested: string) {
  return hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function atTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export async function createBooking(
  input: BookingInput,
  requestedLocale: string,
): Promise<BookingResult> {
  const locale = resolveLocale(requestedLocale);
  const translateError = await getTranslations({
    locale,
    namespace: "Booking.errors",
  });
  const parsed = bookingSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: translateError("invalidInput") };
  }

  const { bikeId, date, endDate, time, hours, accessories, email } =
    parsed.data;

  const startsAt = atTime(date, time);
  const days = endDate ? daysBetween(startsAt, atTime(endDate, time)) : 0;

  if (days < 0 || days > MAX_DAYS) {
    return { ok: false, error: translateError("invalidInput") };
  }

  const endsAt =
    days > 0
      ? atTime(endDate as string, time)
      : new Date(startsAt.getTime() + hours * 60 * 60 * 1000);

  if (endsAt <= new Date()) {
    return { ok: false, error: translateError("pastDate") };
  }

  const bike = await prisma.bike.findUnique({ where: { id: bikeId } });

  if (!bike) {
    return { ok: false, error: translateError("bikeNotFound") };
  }

  if (bike.status !== BikeStatus.AVAILABLE) {
    return { ok: false, error: translateError("bikeUnavailable") };
  }

  const { total: totalPrice } = quoteRental(bike, { days, hours, accessories });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split("@")[0] },
  });

  const code = randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, "0");

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

export async function confirmBooking(
  rentalId: string,
  code: string,
  requestedLocale: string,
): Promise<VerificationResult> {
  const locale = resolveLocale(requestedLocale);
  const translateError = await getTranslations({
    locale,
    namespace: "Booking.errors",
  });

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { verification: true, bike: true },
  });

  if (!rental?.verification || rental.status !== RentalStatus.PENDING) {
    return { ok: false, error: translateError("bookingNotFound") };
  }

  const { verification } = rental;

  if (verification.consumedAt || verification.expiresAt < new Date()) {
    return { ok: false, error: translateError("codeExpired") };
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: translateError("tooManyAttempts") };
  }

  const submitted = code.trim();
  const accepted =
    verification.codeHash === hashCode(submitted) ||
    (devCodeAllowed() && submitted === DEV_CODE);

  if (!accepted) {
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });

    return { ok: false, error: translateError("wrongCode") };
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

  // Flushes the cached queries and every prerendered page built from them, in
  // all locales. `updateTag` rather than `revalidateTag` so the customer's next
  // request waits for fresh data instead of being shown the bike as free.
  updateTag(BIKES_TAG);

  return {
    ok: true,
    startsAt: rental.startsAt.toISOString(),
    endsAt: rental.endsAt.toISOString(),
  };
}
