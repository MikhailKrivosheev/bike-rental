import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { BikeType } from '../src/generated/prisma/enums';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const bikes = [
  {
    id: 'gravel',
    model: 'Canyon Grizl 7',
    type: BikeType.GRAVEL,
    pricePerHour: 900,
    pricePerDay: 4500,
    imageUrl: '/Images/Bikes/Canyon.webp',
    description:
      'A fast, forgiving gravel bike for mixed surfaces — wide tyres, relaxed geometry and mounts for everything you need on a long day out.',
  },
  {
    id: 'mtb',
    model: 'Merida Big Nine 400',
    type: BikeType.MTB,
    pricePerHour: 1100,
    pricePerDay: 5500,
    imageUrl: '/Images/Bikes/MTB.webp',
    description:
      'A hardtail mountain bike built for trails and singletrack: air fork, hydraulic disc brakes and grippy 29" tyres.',
  },
  {
    id: 'urban',
    model: "Electra Loft 7D Step-Thru",
    type: BikeType.CITY,
    pricePerHour: 600,
    pricePerDay: 3000,
    imageUrl: '/Images/Bikes/Loft7D.webp',
    description:
      'A women\'s step-through city bike with an upright riding position, fenders and a rack — perfect for commuting and relaxed rides.',
  },
  {
    id: 'vanmoof',
    model: 'VanMoof S3',
    type: BikeType.CITY,
    pricePerHour: 1000,
    pricePerDay: 5000,
    imageUrl: '/Images/Bikes/VanMoof.webp',
    description:
      'A sleek, minimalist urban electric bike with integrated smart features, automatic electronic gear shifting and anti-theft protection — ideal for fast city commutes.',
  },
  {
    id: 'diverge',
    model: 'Specialized Diverge Comp E5',
    type: BikeType.GRAVEL,
    pricePerHour: 900,
    pricePerDay: 4500,
    imageUrl: '/Images/Bikes/Diverge.webp',
    description:
      'A highly versatile gravel bike equipped with Future Shock handlebar suspension, wide tyre clearance and balanced geometry for smooth gravel paths and tarmac alike.',
  },
  {
    id: 'marlin',
    model: 'Trek Marlin 7',
    type: BikeType.MTB,
    pricePerHour: 800,
    pricePerDay: 4000,
    imageUrl: '/Images/Bikes/Marlin.webp',
    description:
      'A trail-ready hardtail mountain bike with a lightweight RockShox air fork, 1×10 Shimano drivetrain and hydraulic disc brakes built for rugged off-road paths.',
  },
];

async function main() {
  const stationData = {
    name: 'Central Station',
    address: 'R. Irene Vilar 53, 4450-125 Matosinhos, Portugal',
    latitude: 41.1856,
    longitude: -8.6935,
  };

  const station = await prisma.station.upsert({
    where: { id: 'station-central' },
    update: stationData,
    create: { id: 'station-central', ...stationData },
  });

  for (const bike of bikes) {
    await prisma.bike.upsert({
      where: { id: bike.id },
      update: bike,
      create: { ...bike, stationId: station.id },
    });
  }

  await prisma.user.upsert({
    where: { email: 'user@user.com' },
    update: { passwordHash: hashPassword('user') },
    create: {
      email: 'user@user.com',
      name: 'Test User',
      passwordHash: hashPassword('user'),
    },
  });

  console.log(`Seeded 1 station, ${bikes.length} bikes and a test user (user@user.com / user).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
