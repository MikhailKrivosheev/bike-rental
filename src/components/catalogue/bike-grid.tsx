'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { BikeCard, type BikeCardModel } from '@/components/catalogue/bike-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Filter = {
  value: string;
  label: string;
};

type BikeGridProps = {
  bikes: BikeCardModel[];
  filters: Filter[];
};

const ALL = 'all';

export function BikeGrid({ bikes, filters }: BikeGridProps) {
  const t = useTranslations('Catalogue');
  const [active, setActive] = useState(ALL);

  const visible = active === ALL ? bikes : bikes.filter((bike) => bike.type === active);
  const options = [{ value: ALL, label: t('filterAll') }, ...filters];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6 border-b pb-5">
        <div>
          <h2 className="mb-1.5 text-xl font-semibold tracking-[-0.01em]">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('count', { count: bikes.length })}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={option.value === active ? 'default' : 'outline'}
              className={cn('h-[34px] px-3.5 text-[13px]')}
              aria-pressed={option.value === active}
              onClick={() => setActive(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{t('noMatches')}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5 pt-7 pb-18">
          {visible.map((bike) => (
            <BikeCard
              key={bike.id}
              bike={bike}
              perHourLabel={t('perHour')}
              bookedLabel={t('booked')}
            />
          ))}
        </div>
      )}
    </>
  );
}
