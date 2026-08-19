import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { BookingDialog } from '@/components/booking/booking-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BikeStatus, RentalStatus } from '@/generated/prisma/enums';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BikePage({ params }: PageProps<'/[locale]/bikes/[id]'>) {
  const { id } = await params;

  const [locale, format, t, tType, tStatus, tDescription, tBooking] = await Promise.all([
    getLocale(),
    getFormatter(),
    getTranslations('BikeDetail'),
    getTranslations('BikeType'),
    getTranslations('BikeStatus'),
    getTranslations('BikeDescriptions'),
    getTranslations('Booking'),
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

  // Descriptions live in the message catalogue so they can be translated;
  // anything not translated yet falls back to the value stored in the database.
  const freesUpAt = bike.rentals.at(0)?.endsAt;

  const description = tDescription.has(bike.id)
    ? tDescription(bike.id)
    : (bike.description ?? t('noDescription'));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
        <Link href="/">&larr; {t('back')}</Link>
      </Button>

      <Card className="overflow-hidden pt-0">
        {bike.imageUrl ? (
          <div className="relative aspect-16/9 w-full bg-muted">
            <Image
              src={bike.imageUrl}
              alt={bike.model}
              fill
              sizes="(min-width: 768px) 672px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        <CardHeader>
          <CardTitle className="font-heading text-2xl">{bike.model}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{tType(bike.type)}</Badge>
            <Badge>{tStatus(bike.status)}</Badge>
          </div>
          <Separator />
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('station')}</dt>
              <dd>{bike.station?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('address')}</dt>
              <dd>{bike.station?.address ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('price')}</dt>
              <dd className="font-medium">
                {formatPrice(bike.pricePerHour, locale)} {t('perHour')}
              </dd>
            </div>
          </dl>
          {bike.status === BikeStatus.AVAILABLE ? (
            <BookingDialog
              className="w-full"
              bike={{
                id: bike.id,
                model: bike.model,
                pricePerHour: bike.pricePerHour,
                stationName: bike.station?.name ?? '—',
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {freesUpAt
                ? tBooking('availableFrom', {
                    date: format.dateTime(freesUpAt, { dateStyle: 'medium', timeStyle: 'short' }),
                  })
                : tBooking('unavailable')}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
