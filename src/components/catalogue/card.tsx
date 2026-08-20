'use client';

import Image from 'next/image';

import { Dialog } from 'Components/booking/dialog';
import {
  CARD_BADGE_AVAILABLE_CLASS,
  CARD_BADGE_BOOKED_CLASS,
  CARD_BADGE_CLASS,
  CARD_IMAGE_BOOKED_CLASS,
  CARD_IMAGE_CLASS,
  CARD_IMAGE_SIZES,
} from 'Components/catalogue/constants';
import type { CardProps } from 'Components/catalogue/types';
import { Button } from 'Components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from 'Lib/utils';

export function Card({ bike, perHourLabel, perDayLabel, bookedLabel, isSignedIn, className, style }: CardProps) {
  const imageClassName = cn(CARD_IMAGE_CLASS, !bike.isAvailable && CARD_IMAGE_BOOKED_CLASS);

  const availabilityClassName = cn(
    CARD_BADGE_CLASS,
    bike.isAvailable ? CARD_BADGE_AVAILABLE_CLASS : CARD_BADGE_BOOKED_CLASS,
  );

  return (
    <article
      style={style}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[14px] border bg-card transition-[box-shadow,border-color] duration-150 hover:border-ring/40 hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)]',
        className,
      )}
    >
      <div className="relative aspect-4/3 border-b bg-muted">
        {bike.imageUrl ? (
          <Image
            src={bike.imageUrl}
            alt={bike.model}
            fill
            sizes={CARD_IMAGE_SIZES}
            className={imageClassName}
          />
        ) : null}

        <span className="absolute top-3 left-3 inline-flex h-6 items-center rounded-full border bg-background px-2.5 text-xs font-medium">
          {bike.typeLabel}
        </span>
        <span className={availabilityClassName}>
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

        <p className="line-clamp-3 text-sm leading-[1.55] text-pretty text-muted-foreground">{bike.description}</p>

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
            <Dialog
              className="relative z-10 h-9 px-4"
              isSignedIn={isSignedIn}
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
