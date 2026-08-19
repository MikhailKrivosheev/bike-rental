'use client';

import { useLocale } from 'next-intl';

import { AnimatedPrice } from '@/components/booking/animated-price';
import type { Booking, BookingBike } from '@/components/booking/hooks/use-booking';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

type TotalProps = {
  booking: Booking;
  bike: BookingBike;
  /** The dialog puts the summary on a muted plate; the sidebar keeps it flat. */
  plate?: boolean;
};

export function Total({ booking, bike, plate = false }: TotalProps) {
  const { translate } = booking;
  const locale = useLocale();

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 text-sm',
        plate && 'rounded-[10px] bg-muted px-3.5 py-3',
      )}
    >
      <span className="text-muted-foreground">
        {booking.quote.unit === 'day'
          ? translate('calculationDays', {
              price: formatPrice(bike.pricePerDay, locale),
              days: booking.quote.units,
            })
          : translate('calculation', {
              price: formatPrice(bike.pricePerHour, locale),
              hours: booking.quote.units,
            })}
      </span>
      <AnimatedPrice cents={booking.total} className="text-base font-semibold" />
    </div>
  );
}
