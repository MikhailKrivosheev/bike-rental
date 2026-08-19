import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { BookingDialog } from '@/components/booking/booking-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BikeStatus, RentalStatus } from '@/generated/prisma/enums';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/utils';

// The catalogue reads the database, so render it per request instead of at build time.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [locale, format, t, tType, tBooking] = await Promise.all([
    getLocale(),
    getFormatter(),
    getTranslations('Catalogue'),
    getTranslations('BikeType'),
    getTranslations('Booking'),
  ]);

  const bikes = await prisma.bike.findMany({
    where: { status: { not: BikeStatus.RETIRED } },
    include: {
      station: true,
      // The rental that currently holds the bike, used to show when it frees up.
      rentals: {
        where: { status: RentalStatus.ACTIVE },
        orderBy: { endsAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ status: 'asc' }, { pricePerHour: 'asc' }],
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      {bikes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('emptyTitle')}</CardTitle>
            <CardDescription>{t('emptyDescription')}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul id="bikes" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.map((bike) => {
            const isAvailable = bike.status === BikeStatus.AVAILABLE;
            const freesUpAt = bike.rentals.at(0)?.endsAt;

            return (
              <li key={bike.id}>
                <Card
                  className={cn(
                    'group relative h-full gap-4 overflow-hidden pt-0 transition-shadow',
                    isAvailable ? 'hover:shadow-md' : 'bg-muted/40',
                  )}
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                    {bike.imageUrl ? (
                      <Image
                        src={bike.imageUrl}
                        alt={bike.model}
                        fill
                        sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw"
                        className={cn(
                          'object-cover transition-transform duration-300',
                          isAvailable ? 'group-hover:scale-105' : 'opacity-50 grayscale',
                        )}
                      />
                    ) : null}
                    <Badge className="absolute top-3 left-3" variant="secondary">
                      {tType(bike.type)}
                    </Badge>
                    {isAvailable ? null : (
                      <Badge className="absolute top-3 right-3" variant="destructive">
                        {tBooking('unavailable')}
                      </Badge>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle>
                      {/* Stretched link: the whole card opens the bike page, while the
                          booking button on top stays clickable. */}
                      <Link
                        href={`/bikes/${bike.id}`}
                        className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                      >
                        {bike.model}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {isAvailable
                        ? (bike.station?.name ?? t('noStation'))
                        : freesUpAt
                          ? tBooking('availableFrom', {
                              date: format.dateTime(freesUpAt, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              }),
                            })
                          : tBooking('unavailable')}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex items-center justify-between gap-3">
                    <span className={cn('text-lg font-medium', !isAvailable && 'text-muted-foreground')}>
                      {formatPrice(bike.pricePerHour, locale)}
                      <span className="text-sm text-muted-foreground"> {t('perHour')}</span>
                    </span>

                    {isAvailable ? (
                      <BookingDialog
                        className="relative z-10"
                        bike={{
                          id: bike.id,
                          model: bike.model,
                          pricePerHour: bike.pricePerHour,
                          stationName: bike.station?.name ?? t('noStation'),
                        }}
                      />
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
