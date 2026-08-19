import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { BikeType } from '../src/generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const station = await prisma.station.upsert({
    where: { id: 'station-central' },
    update: {},
    create: {
      id: 'station-central',
      name: 'Центральная',
      address: 'ул. Ленина, 1',
      latitude: 55.7558,
      longitude: 37.6173,
    },
  });

  const bikes = [
    { model: 'Stels Navigator 500', type: BikeType.CITY, pricePerHour: 15000 },
    { model: 'Merida Big Nine', type: BikeType.MOUNTAIN, pricePerHour: 30000 },
    { model: 'Giant Contend', type: BikeType.ROAD, pricePerHour: 35000 },
    { model: 'Xiaomi Himo C20', type: BikeType.ELECTRIC, pricePerHour: 50000 },
    { model: 'Forward Cosmo 16', type: BikeType.KIDS, pricePerHour: 10000 },
  ];

  for (const bike of bikes) {
    await prisma.bike.upsert({
      where: { id: bike.model.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: bike.model.toLowerCase().replace(/\s+/g, '-'),
        ...bike,
        stationId: station.id,
        description: 'Велосипед в отличном состоянии, регулярное ТО.',
      },
    });
  }

  console.log(`Готово: 1 станция, ${bikes.length} велосипедов.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
