"use server";

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { updateTag } from "next/cache";
import { z } from "zod";

import { BikeStatus, RentalStatus } from "@/generated/prisma/enums";
import { routing } from "@/i18n/routing";
import {
  MAX_DAYS,
  accessoryIds,
  daysBetween,
  hoursBetween,
  pickupTimes,
  quoteRental,
} from "Lib/rental";
import { CODE_TTL_MINUTES, MAX_ATTEMPTS, codeMatches, generateCode, hashCode } from "Lib/otp";
import { prisma } from "Lib/prisma";
import { BIKES_TAG } from "@/server/catalogue";
import { getCurrentUser, startSession } from "@/server/auth";
import { sendVerificationCode } from "@/server/email";

export type BookingResult =
  | { ok: true; rentalId: string; confirmed: false }
  | { ok: true; rentalId: string; confirmed: true; startsAt: string; endsAt: string }
  | { ok: false; error: string };

export type BookedRange = { startsAt: string; endsAt: string };

/**
 * Every future window this bike is already spoken for, so the date/time
 * pickers can show it instead of letting a visitor pick a slot the server
 * will just reject at submit time.
 */
export async function getBikeBookedRanges(bikeId: string): Promise<BookedRange[]> {
  const rentals = await prisma.rental.findMany({
    where: {
      bikeId,
      status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] },
      endsAt: { gt: new Date() },
    },
    select: { startsAt: true, endsAt: true },
    orderBy: { startsAt: "asc" },
  });

  return rentals.map((rental) => ({
    startsAt: rental.startsAt.toISOString(),
    endsAt: rental.endsAt.toISOString(),
  }));
}

export type VerificationResult =
  { ok: true; startsAt: string; endsAt: string } | { ok: false; error: string };

const bookingSchema = z.object({
  bikeId: z.string().min(1),
  date: z.iso.date(),
  endDate: z.iso.date().optional(),
  time: z.enum(pickupTimes as [string, ...string[]]),
  endTime: z.enum(pickupTimes as [string, ...string[]]),
  accessories: z
    .array(z.enum(accessoryIds as [string, ...string[]]))
    .default([]),
  email: z.email().optional(),
});

export type BookingInput = z.input<typeof bookingSchema>;

/** Server Actions can't read `next/root-params`, so the client passes the locale in. */
function resolveLocale(requested: string) {
  return hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
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

  const { bikeId, date, endDate, time, endTime, accessories, email } =
    parsed.data;

  // A signed-in visitor has already proven their email once at login, so the
  // session — not the client-supplied field — is the source of truth for who
  // this booking belongs to.
  const sessionUser = await getCurrentUser();

  if (!sessionUser && !email) {
    return { ok: false, error: translateError("invalidInput") };
  }

  const startsAt = atTime(date, time);
  const days = endDate ? daysBetween(startsAt, atTime(endDate, time)) : 0;

  if (days < 0 || days > MAX_DAYS) {
    return { ok: false, error: translateError("invalidInput") };
  }

  const endsAt = days > 0 ? atTime(endDate as string, endTime) : atTime(date, endTime);

  if (endsAt <= startsAt) {
    return { ok: false, error: translateError("invalidInput") };
  }

  if (endsAt <= new Date()) {
    return { ok: false, error: translateError("pastDate") };
  }

  const bike = await prisma.bike.findUnique({ where: { id: bikeId } });

  if (!bike) {
    return { ok: false, error: translateError("bikeNotFound") };
  }

  if (bike.status === BikeStatus.MAINTENANCE || bike.status === BikeStatus.RETIRED) {
    return { ok: false, error: translateError("bikeUnavailable") };
  }

  // Availability is per time slot, not a single global flag — a bike booked
  // nine days out must stay bookable by everyone else until then, so this
  // checks for an actual overlap with existing (unpaid or paid) rentals
  // instead of a blanket bike.status.
  const overlappingRental = await prisma.rental.findFirst({
    where: {
      bikeId: bike.id,
      status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });

  if (overlappingRental) {
    return { ok: false, error: translateError("bikeUnavailable") };
  }

  const hours = hoursBetween(time, endTime);
  const { total: totalPrice } = quoteRental(bike, { days, hours, accessories });

  const user =
    sessionUser ??
    (await prisma.user.upsert({
      where: { email: email as string },
      update: {},
      create: { email: email as string, name: (email as string).split("@")[0] },
    }));

  if (sessionUser) {
    const rental = await prisma.rental.create({
      data: {
        userId: user.id,
        bikeId: bike.id,
        status: RentalStatus.PENDING,
        startsAt,
        endsAt,
        accessories,
        totalPrice,
      },
    });

    return {
      ok: true,
      rentalId: rental.id,
      confirmed: true,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
  }

  const code = generateCode();

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

  await sendVerificationCode({ to: user.email, code, bikeModel: bike.model });

  return { ok: true, rentalId: rental.id, confirmed: false };
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

  if (!codeMatches(submitted, verification.codeHash)) {
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });

    return { ok: false, error: translateError("wrongCode") };
  }

  // The rental stays PENDING until the customer pays on the summary step;
  // this just proves the email is theirs.
  await prisma.verificationCode.update({
    where: { id: verification.id },
    data: { consumedAt: new Date() },
  });

  await startSession(rental.userId);

  return {
    ok: true,
    startsAt: rental.startsAt.toISOString(),
    endsAt: rental.endsAt.toISOString(),
  };
}

export type MyBooking = {
  id: string;
  bikeModel: string;
  status: RentalStatus;
  startsAt: string;
  endsAt: string;
  totalPrice: number;
};

export async function getMyBookings(userId: string): Promise<MyBooking[]> {
  const rentals = await prisma.rental.findMany({
    where: { userId },
    include: { bike: true },
    orderBy: { startsAt: "desc" },
  });

  return rentals.map((rental) => ({
    id: rental.id,
    bikeModel: rental.bike.model,
    status: rental.status,
    startsAt: rental.startsAt.toISOString(),
    endsAt: rental.endsAt.toISOString(),
    totalPrice: rental.totalPrice,
  }));
}

export type PaymentResult = { ok: true } | { ok: false; error: string };

/** Stand-in for the real MBWay charge, which will replace this later. */
export async function payBooking(
  rentalId: string,
  requestedLocale: string,
): Promise<PaymentResult> {
  const locale = resolveLocale(requestedLocale);
  const translateError = await getTranslations({
    locale,
    namespace: "Booking.errors",
  });

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { verification: true },
  });

  if (!rental || rental.status !== RentalStatus.PENDING) {
    return { ok: false, error: translateError("bookingNotFound") };
  }

  // A rental created for a signed-in visitor has no VerificationCode at all —
  // the session already proved the email, so there was nothing to consume.
  if (rental.verification && !rental.verification.consumedAt) {
    return { ok: false, error: translateError("bookingNotFound") };
  }

  // Paying confirms the rental, not the bike's global status — the bike stays
  // AVAILABLE for every other slot; only this rental's own [startsAt, endsAt)
  // window is now taken, which the catalogue and createBooking derive from
  // the Rental table directly.
  await prisma.rental.update({
    where: { id: rental.id },
    data: { status: RentalStatus.ACTIVE },
  });

  // Flushes the cached queries and every prerendered page built from them, in
  // all locales. `updateTag` rather than `revalidateTag` so the customer's next
  // request waits for fresh data instead of being shown the bike as free.
  updateTag(BIKES_TAG);

  return { ok: true };
}
