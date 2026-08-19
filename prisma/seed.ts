import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { BikeType } from '../src/generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const bikes = [
  {
    id: 'gravel',
    model: 'Canyon Grizl 7',
    type: BikeType.GRAVEL,
    pricePerHour: 900,
    imageUrl: '/Images/Bikes/gravel.webp',
    description:
      'A fast, forgiving gravel bike for mixed surfaces — wide tyres, relaxed geometry and mounts for everything you need on a long day out.',
  },
  {
    id: 'mtb',
    model: 'Merida Big Nine 400',
    type: BikeType.MTB,
    pricePerHour: 1100,
    imageUrl: '/Images/Bikes/MTB.webp',
    description:
      'A hardtail mountain bike built for trails and singletrack: air fork, hydraulic disc brakes and grippy 29" tyres.',
  },
  {
    id: 'urban',
    model: "Electra Loft 7D Step-Thru",
    type: BikeType.CITY,
    pricePerHour: 600,
    imageUrl: '/Images/Bikes/urban.webp',
    description:
      'A women\'s step-through city bike with an upright riding position, fenders and a rack — perfect for commuting and relaxed rides.',
  },
];

async function main() {
  const station = await prisma.station.upsert({
    where: { id: 'station-central' },
    update: {},
    create: {
      id: 'station-central',
      name: 'Central Station',
      address: '1 Market Street',
      latitude: 55.7558,
      longitude: 37.6173,
    },
  });

  for (const bike of bikes) {
    await prisma.bike.upsert({
      where: { id: bike.id },
      update: bike,
      create: { ...bike, stationId: station.id },
    });
  }

  console.log(`Seeded 1 station and ${bikes.length} bikes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
