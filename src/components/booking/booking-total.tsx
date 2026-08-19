'use client';

import { useLocale } from 'next-intl';

import { AnimatedPrice } from '@/components/booking/animated-price';
import type { Booking, BookingBike } from '@/components/booking/use-booking';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

type BookingTotalProps = {
  booking: Booking;
  bike: BookingBike;
  /** The dialog puts the summary on a muted plate; the sidebar keeps it flat. */
  plate?: boolean;
};

export function BookingTotal({ booking, bike, plate = false }: BookingTotalProps) {
  const { t } = booking;
  const locale = useLocale();

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 text-sm',
        plate && 'rounded-[10px] bg-muted px-3.5 py-3',
      )}
    >
      <span className="text-muted-foreground">
        {t('calculation', {
          price: formatPrice(bike.pricePerHour, locale),
          hours: booking.hours,
        })}
      </span>
      <AnimatedPrice cents={booking.total} className="text-base font-semibold" />
    </div>
  );
}
