'use client';

import { useLocale } from 'next-intl';

import {
  ANIMATED_PRICE_CLASS,
  ANIMATED_PRICE_RUNNING_CLASS,
} from 'Components/booking/constants';
import type { AnimatedPriceProps } from 'Components/booking/types';
import { useAnimatedNumber } from 'Hooks/use-animated-number';
import { formatPrice } from 'Lib/format';
import { cn } from 'Lib/utils';

export function AnimatedPrice({ cents, className }: AnimatedPriceProps) {
  const locale = useLocale();
  const animated = useAnimatedNumber(cents);
  const isSettled = Math.round(animated) === cents;

  const priceClassName = cn(
    ANIMATED_PRICE_CLASS,
    !isSettled && ANIMATED_PRICE_RUNNING_CLASS,
    className,
  );

  return (
    <span
      className={priceClassName}
      aria-label={formatPrice(cents, locale)}
    >
      <span aria-hidden>{formatPrice(Math.round(animated), locale)}</span>
    </span>
  );
}
