import { getFormatter, getLocale, getTranslations } from 'next-intl/server';

import { Grid } from 'Components/catalogue/grid';
import type { CardModel } from 'Components/catalogue/types';
import { Section } from '@/components/shared/section';
import { BikeType } from '@/generated/prisma/enums';
import { formatPrice } from 'Lib/format';
import { getCurrentUser } from '@/server/auth';
import { getCatalogueBikes } from '@/server/catalogue';

// Prerendered and refreshed in the background; booking a bike flushes it early
// through the `bikes` tag, so the grid never shows a stale availability badge.
export const revalidate = 300;

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

  const [bikes, user] = await Promise.all([getCatalogueBikes(), getCurrentUser()]);

  const cards: CardModel[] = bikes.map((bike) => {
    const isAvailable = bike.isAvailable;
    const freesUpAt = bike.freesUpAt ? new Date(bike.freesUpAt) : undefined;

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
      stationName: bike.stationName ?? '—',
      isAvailable,
      availabilityLabel: isAvailable
        ? translateCatalogue('free')
        : freesUpAt
          ? translateCatalogue('bookedUntil', {
              time: format.dateTime(freesUpAt, { dateStyle: 'medium', timeStyle: 'short' }),
            })
          : translateCatalogue('booked'),
    };
  });

  const availableCount = cards.filter((bike) => bike.isAvailable).length;

  return (
    <main className="flex-1">
      <Section top="xl" bottom="lg">
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
      </Section>

      <Section id="catalogue" anchored top="none" bottom="sm">
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
            userEmail={user?.email ?? null}
          />
        )}
      </Section>
    </main>
  );
}
