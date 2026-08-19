'use client';

import Image from 'next/image';

import { BookingDialog } from '@/components/booking/booking-dialog';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type BikeCardModel = {
  id: string;
  model: string;
  type: string;
  typeLabel: string;
  description: string;
  specs: string[];
  price: number;
  priceLabel: string;
  pricePerDay: number;
  pricePerDayLabel: string;
  imageUrl: string | null;
  stationName: string;
  isAvailable: boolean;
  availabilityLabel: string;
};

type BikeCardProps = {
  bike: BikeCardModel;
  perHourLabel: string;
  perDayLabel: string;
  bookedLabel: string;
};

export function BikeCard({ bike, perHourLabel, perDayLabel, bookedLabel }: BikeCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[14px] border bg-card transition-[box-shadow,border-color] duration-150 hover:border-ring/40 hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)]">
      <div className="relative aspect-4/3 border-b bg-muted">
        {bike.imageUrl ? (
          <Image
            src={bike.imageUrl}
            alt={bike.model}
            fill
            sizes="(min-width: 1180px) 380px, (min-width: 640px) 45vw, 100vw"
            className={cn('object-cover', !bike.isAvailable && 'opacity-50 grayscale')}
          />
        ) : null}

        <span className="absolute top-3 left-3 inline-flex h-6 items-center rounded-full border bg-background px-2.5 text-xs font-medium">
          {bike.typeLabel}
        </span>
        <span
          className={cn(
            'absolute top-3 right-3 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium',
            bike.isAvailable
              ? 'border bg-background'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {bike.availabilityLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
        <h3 className="text-base font-semibold tracking-[-0.01em]">
          {/* Stretched link: the whole card opens the bike page, the button stays on top. */}
          <Link
            href={`/bikes/${bike.id}`}
            className="after:absolute after:inset-0 after:rounded-[14px] focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
          >
            {bike.model}
          </Link>
        </h3>

        <p className="text-sm leading-[1.55] text-pretty text-muted-foreground">{bike.description}</p>

        <div className="mt-0.5 flex flex-wrap gap-1.5">
          {bike.specs.map((spec) => (
            <span
              key={spec}
              className="inline-flex h-[22px] items-center rounded-md bg-muted px-2 text-xs text-muted-foreground"
            >
              {spec}
            </span>
          ))}
        </div>

        <div className="flex-1" />

        <div className="mt-1 flex items-center justify-between gap-3 border-t pt-3.5">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold tracking-[-0.02em]">{bike.priceLabel}</span>
              <span className="text-[13px] text-muted-foreground">{perHourLabel}</span>
            </div>
            <span className="text-[13px] text-muted-foreground">
              {bike.pricePerDayLabel} {perDayLabel}
            </span>
          </div>

          {bike.isAvailable ? (
            <BookingDialog
              className="relative z-10 h-9 px-4"
              bike={{
                id: bike.id,
                model: bike.model,
                pricePerHour: bike.price,
                pricePerDay: bike.pricePerDay,
                stationName: bike.stationName,
              }}
            />
          ) : (
            <Button size="sm" className="relative z-10 h-9 px-4" disabled>
              {bookedLabel}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
