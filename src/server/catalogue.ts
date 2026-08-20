import 'server-only';

import { unstable_cache } from 'next/cache';

import { BikeStatus, type BikeType, RentalStatus } from '@/generated/prisma/enums';
import { prisma } from 'Lib/prisma';

/** Revalidation tag for everything the catalogue reads. */
export const BIKES_TAG = 'bikes';

/** Ceiling on how stale the catalogue may get without a booking to flush it. */
const REVALIDATE_SECONDS = 300;

/**
 * The cache stores JSON, so `Date` values would come back as strings. Both
 * queries therefore return this flat, already-serialisable shape instead of the
 * raw Prisma rows.
 */
export type CatalogueBike = {
  id: string;
  model: string;
  type: BikeType;
  status: BikeStatus;
  /** Whether the bike can be booked right now — false while it's out on a rental that covers this moment, or under maintenance/retired. */
  isAvailable: boolean;
  description: string | null;
  pricePerHour: number;
  pricePerDay: number;
  imageUrl: string | null;
  stationName: string | null;
  /** ISO timestamp when the current rental ends, or null when none is active. */
  freesUpAt: string | null;
};

/**
 * Rentals block a bike from the catalogue's "available now" badge only while
 * they're actually under way — a rental starting in nine days shouldn't make
 * the bike look booked today. Overlap for a *specific* requested slot is
 * checked separately in `createBooking`.
 */
function withStationAndActiveRental(now: Date) {
  return {
    station: true,
    rentals: {
      where: { status: RentalStatus.ACTIVE, startsAt: { lte: now }, endsAt: { gt: now } },
      orderBy: { endsAt: 'desc' },
      take: 1,
    },
  } as const;
}

type BikeRow = {
  id: string;
  model: string;
  type: BikeType;
  status: BikeStatus;
  description: string | null;
  pricePerHour: number;
  pricePerDay: number;
  imageUrl: string | null;
  station: { name: string } | null;
  rentals: { endsAt: Date }[];
};

function toCatalogueBike(bike: BikeRow): CatalogueBike {
  return {
    id: bike.id,
    model: bike.model,
    type: bike.type,
    status: bike.status,
    isAvailable: bike.status === BikeStatus.AVAILABLE && bike.rentals.length === 0,
    description: bike.description,
    pricePerHour: bike.pricePerHour,
    pricePerDay: bike.pricePerDay,
    imageUrl: bike.imageUrl,
    stationName: bike.station?.name ?? null,
    freesUpAt: bike.rentals.at(0)?.endsAt.toISOString() ?? null,
  };
}

/** Every bike still in the fleet, ordered as the catalogue grid shows them. */
export const getCatalogueBikes = unstable_cache(
  async (): Promise<CatalogueBike[]> => {
    const bikes = await prisma.bike.findMany({
      where: { status: { not: BikeStatus.RETIRED } },
      include: withStationAndActiveRental(new Date()),
      orderBy: [{ status: 'asc' }, { pricePerHour: 'asc' }],
    });

    return bikes.map(toCatalogueBike);
  },
  ['catalogue-bikes'],
  { tags: [BIKES_TAG], revalidate: REVALIDATE_SECONDS },
);

/** A single bike for its detail page, or null when the id is unknown. */
export const getBike = unstable_cache(
  async (id: string): Promise<CatalogueBike | null> => {
    const bike = await prisma.bike.findUnique({
      where: { id },
      include: withStationAndActiveRental(new Date()),
    });

    return bike ? toCatalogueBike(bike) : null;
  },
  ['catalogue-bike'],
  { tags: [BIKES_TAG], revalidate: REVALIDATE_SECONDS },
);
