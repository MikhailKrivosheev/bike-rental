'use client';

import { useLocale } from 'next-intl';

import { useAnimatedNumber } from '@/hooks/use-animated-number';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

type AnimatedPriceProps = {
  cents: number;
  className?: string;
};

export function AnimatedPrice({ cents, className }: AnimatedPriceProps) {
  const locale = useLocale();
  const animated = useAnimatedNumber(cents);
  const isSettled = Math.round(animated) === cents;

  return (
    <span
      className={cn(
        'tabular-nums transition-colors duration-200',
        !isSettled && 'text-primary',
        className,
      )}
      // The animated digits are noise for assistive tech; announce the final value.
      aria-label={formatPrice(cents, locale)}
    >
      <span aria-hidden>{formatPrice(Math.round(animated), locale)}</span>
    </span>
  );
}
