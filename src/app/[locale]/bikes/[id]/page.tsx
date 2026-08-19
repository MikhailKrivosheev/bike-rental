import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { BookingPanel } from '@/components/booking/booking-panel';
import { Button } from '@/components/ui/button';
import { BikeStatus, RentalStatus } from '@/generated/prisma/enums';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BikePage({ params }: PageProps<'/[locale]/bikes/[id]'>) {
  const { id } = await params;

  const [locale, format, t, tCatalogue, tSpecs, tDescription] = await Promise.all([
    getLocale(),
    getFormatter(),
    getTranslations('BikeDetail'),
    getTranslations('Catalogue'),
    getTranslations('BikeSpecTable'),
    getTranslations('BikeDescriptions'),
  ]);

  const bike = await prisma.bike.findUnique({
    where: { id },
    include: {
      station: true,
      rentals: {
        where: { status: RentalStatus.ACTIVE },
        orderBy: { endsAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!bike) {
    notFound();
  }

  const isAvailable = bike.status === BikeStatus.AVAILABLE;
  const freesUpAt = bike.rentals.at(0)?.endsAt;

  // Descriptions and spec sheets live in the message catalogue so they can be
  // translated; anything missing falls back to the database value.
  const description = tDescription.has(bike.id)
    ? tDescription(bike.id)
    : (bike.description ?? t('noDescription'));

  const specs = tSpecs.has(bike.id)
    ? Object.entries(tSpecs.raw(bike.id) as Record<string, string>)
    : [];

  return (
    <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 pt-8 pb-20">
      <Button asChild variant="outline" size="sm" className="mb-6 h-8 text-[13px]">
        <Link href="/">{t('back')}</Link>
      </Button>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-16/10 overflow-hidden rounded-[14px] border bg-muted">
            {bike.imageUrl ? (
              <Image
                src={bike.imageUrl}
                alt={bike.model}
                fill
                sizes="(min-width: 1180px) 720px, 100vw"
                className="object-cover"
                priority
              />
            ) : null}
          </div>

          <div className="pt-3">
            <h1 className="mb-2.5 text-[32px] font-semibold tracking-[-0.025em]">{bike.model}</h1>
            <p className="mb-6 max-w-[60ch] text-base leading-[1.65] text-pretty text-muted-foreground">
              {description}
            </p>

            {specs.length > 0 ? (
              <>
                <h2 className="mb-3 text-[15px] font-semibold">{t('specs')}</h2>
                <dl className="overflow-hidden rounded-xl border">
                  {specs.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-6 border-b px-4 py-3 text-sm last:border-b-0"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}
          </div>
        </div>

        {isAvailable ? (
          <BookingPanel
            bike={{
              id: bike.id,
              model: bike.model,
              pricePerHour: bike.pricePerHour,
              pricePerDay: bike.pricePerDay,
              stationName: bike.station?.name ?? '—',
            }}
          />
        ) : (
          <aside className="flex flex-col gap-4 rounded-2xl border p-[22px] lg:sticky lg:top-24">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-semibold tracking-[-0.02em]">
                  {formatPrice(bike.pricePerHour, locale)}
                </span>
                <span className="text-sm text-muted-foreground">{t('perHour')}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatPrice(bike.pricePerDay, locale)} {t('perDay')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {freesUpAt
                ? tCatalogue('bookedUntil', {
                    time: format.dateTime(freesUpAt, { dateStyle: 'medium', timeStyle: 'short' }),
                  })
                : tCatalogue('booked')}
            </p>
          </aside>
        )}
      </div>
    </main>
  );
}
