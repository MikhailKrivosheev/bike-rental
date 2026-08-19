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
  description: string | null;
  pricePerHour: number;
  pricePerDay: number;
  imageUrl: string | null;
  stationName: string | null;
  /** ISO timestamp when the current rental ends, or null when none is active. */
  freesUpAt: string | null;
};

const withStationAndActiveRental = {
  station: true,
  rentals: {
    where: { status: RentalStatus.ACTIVE },
    orderBy: { endsAt: 'desc' },
    take: 1,
  },
} as const;

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
      include: withStationAndActiveRental,
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
      include: withStationAndActiveRental,
    });

    return bike ? toCatalogueBike(bike) : null;
  },
  ['catalogue-bike'],
  { tags: [BIKES_TAG], revalidate: REVALIDATE_SECONDS },
);
