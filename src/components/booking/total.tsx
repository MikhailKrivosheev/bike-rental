'use client';

import { useLocale } from 'next-intl';

import { AnimatedPrice } from 'Components/booking/animated-price';
import { TOTAL_CLASS, TOTAL_PLATE_CLASS } from 'Components/booking/constants';
import type { TotalProps } from 'Components/booking/types';
import { formatPrice } from 'Lib/format';
import { cn } from 'Lib/utils';

export function Total({ booking, bike, plate = false }: TotalProps) {
  const { translate } = booking;
  const locale = useLocale();

  const totalClassName = cn(TOTAL_CLASS, plate && TOTAL_PLATE_CLASS);

  return (
    <div className={totalClassName}>
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
