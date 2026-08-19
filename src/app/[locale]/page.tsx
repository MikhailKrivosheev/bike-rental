import { getFormatter, getLocale, getTranslations } from 'next-intl/server';

import type { CardModel } from '@/components/catalogue/card';
import { Grid } from '@/components/catalogue/grid';
import { BikeStatus, BikeType, RentalStatus } from '@/generated/prisma/enums';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

// The catalogue reads the database, so render it per request instead of at build time.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [
    locale,
    format,
    translateCatalogue,
    translateHero,
    translateType,
    translateSpecs,
    translateDescription,
  ] = await Promise.all([
    getLocale(),
    getFormatter(),
    getTranslations('Catalogue'),
    getTranslations('Hero'),
    getTranslations('BikeType'),
    getTranslations('BikeSpecs'),
    getTranslations('BikeDescriptions'),
  ]);

  const bikes = await prisma.bike.findMany({
    where: { status: { not: BikeStatus.RETIRED } },
    include: {
      station: true,
      rentals: {
        where: { status: RentalStatus.ACTIVE },
        orderBy: { endsAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ status: 'asc' }, { pricePerHour: 'asc' }],
  });

  const cards: CardModel[] = bikes.map((bike) => {
    const isAvailable = bike.status === BikeStatus.AVAILABLE;
    const freesUpAt = bike.rentals.at(0)?.endsAt;

    return {
      id: bike.id,
      model: bike.model,
      type: bike.type,
      typeLabel: translateType(bike.type),
      description: translateDescription.has(bike.id)
        ? translateDescription(bike.id)
        : (bike.description ?? ''),
      specs: translateSpecs.has(bike.id) ? (translateSpecs.raw(bike.id) as string[]) : [],
      price: bike.pricePerHour,
      priceLabel: formatPrice(bike.pricePerHour, locale),
      pricePerDay: bike.pricePerDay,
      pricePerDayLabel: formatPrice(bike.pricePerDay, locale),
      imageUrl: bike.imageUrl,
      stationName: bike.station?.name ?? '—',
      isAvailable,
      availabilityLabel: isAvailable
        ? translateCatalogue('free')
        : freesUpAt
          ? translateCatalogue('bookedUntil', { time: format.dateTime(freesUpAt, { timeStyle: 'short' }) })
          : translateCatalogue('booked'),
    };
  });

  const availableCount = cards.filter((bike) => bike.isAvailable).length;

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-[1180px] px-6 pt-16 pb-10">
        <div className="mb-5 inline-flex h-[26px] items-center gap-2 rounded-full border bg-muted/40 px-2.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {translateHero('available', { count: availableCount })}
        </div>
        <h1 className="mb-3.5 max-w-[16ch] text-[44px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">
          {translateHero('title')}
        </h1>
        <p className="max-w-[56ch] text-base leading-relaxed text-pretty text-muted-foreground">
          {translateHero('subtitle')}
        </p>
      </section>

      <section id="catalogue" className="mx-auto w-full max-w-[1180px] scroll-mt-20 px-6 pb-6">
        {cards.length === 0 ? (
          <div className="rounded-[14px] border p-6">
            <h2 className="mb-1.5 text-xl font-semibold">{translateCatalogue('emptyTitle')}</h2>
            <p className="text-sm text-muted-foreground">{translateCatalogue('emptyDescription')}</p>
          </div>
        ) : (
          <Grid
            bikes={cards}
            filters={Object.values(BikeType).map((type) => ({
              value: type,
              label: translateType(type),
            }))}
          />
        )}
      </section>
    </main>
  );
}
