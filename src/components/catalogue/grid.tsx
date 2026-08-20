'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Card } from 'Components/catalogue/card';
import { ALL_TYPES, FILTER_BUTTON_CLASS } from 'Components/catalogue/constants';
import type { GridProps } from 'Components/catalogue/types';
import { Button } from 'Components/ui/button';

export function Grid({ bikes, filters, isSignedIn }: GridProps) {
  const translate = useTranslations('Catalogue');
  const [active, setActive] = useState(ALL_TYPES);

  const visible = active === ALL_TYPES ? bikes : bikes.filter((bike) => bike.type === active);
  const options = [{ value: ALL_TYPES, label: translate('filterAll') }, ...filters];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6 border-b pb-5">
        <div>
          <h2 className="mb-1.5 text-xl font-semibold tracking-[-0.01em]">{translate('title')}</h2>
          <p className="text-sm text-muted-foreground">{translate('count', { count: bikes.length })}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={option.value === active ? 'default' : 'outline'}
              className={FILTER_BUTTON_CLASS}
              aria-pressed={option.value === active}
              onClick={() => setActive(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{translate('noMatches')}</p>
      ) : (
        <div
          key={active}
          className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5 pt-7 pb-18"
        >
          {visible.map((bike, index) => (
            <Card
              key={bike.id}
              bike={bike}
              perHourLabel={translate('perHour')}
              perDayLabel={translate('perDay')}
              bookedLabel={translate('booked')}
              isSignedIn={isSignedIn}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-300 ease-out"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            />
          ))}
        </div>
      )}
    </>
  );
}
